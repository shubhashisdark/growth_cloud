import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";
import { WorkspacesService } from "./services/workspaces.service.js";
import { AuthService } from "../auth/services/auth.service.js";

test("WorkspacesService - full lifecycle", async () => {
  const authService = new AuthService();
  const workspacesService = new WorkspacesService();

  const ownerEmail = `ws_owner_${Date.now()}@example.com`;
  const signupRes = await authService.signup({
    name: "Workspace Owner",
    email: ownerEmail,
    password: "Password123!",
    workspaceName: "Initial Workspace"
  });

  const ownerId = signupRes.data!.user.id;
  const workspaceId = signupRes.data!.workspace.id;

  // 1. Get Workspace
  const getRes = await workspacesService.getWorkspace(workspaceId);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.data?.workspace.name, "Initial Workspace");

  // 2. Create second workspace
  const createRes = await workspacesService.createWorkspace(ownerId, {
    name: "Secondary Workspace",
    timezone: "America/New_York"
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data?.workspace.timezone, "America/New_York");

  // 3. Update Workspace
  const updateRes = await workspacesService.updateWorkspace(workspaceId, { name: "Renamed Workspace" }, ownerId);
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data?.workspace.name, "Renamed Workspace");

  // 4. Send Invitation
  const inviteRes = await workspacesService.sendInvitation(workspaceId, ownerId, {
    email: `invited_${Date.now()}@example.com`,
    role: "marketer"
  });
  assert.equal(inviteRes.status, 201);
  assert.ok(inviteRes.data?.invitation.id);

  // 5. List Invitations
  const listInvRes = await workspacesService.listInvitations(workspaceId);
  assert.equal(listInvRes.status, 200);
  assert.ok(listInvRes.data?.items.length! >= 1);
});

test("Workspace HTTP routes - authentication & membership guard", async () => {
  const app = createApp();
  const ownerEmail = `ws_http_${Date.now()}@example.com`;

  // 1. Signup owner
  const signupRes = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "HTTP Owner",
        email: ownerEmail,
        password: "Password123!",
        workspaceName: "Guard Workspace"
      })
    })
  );
  const signupBody = await signupRes.json();
  const workspaceId = signupBody.data.workspace.id;

  // Login owner
  const loginRes = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerEmail, password: "Password123!" })
    })
  );
  const loginBody = await loginRes.json();
  const token = loginBody.data.accessToken;

  // Unauthenticated request should fail
  const unauthRes = await (app as any).fetch(
    new Request(`http://127.0.0.1/api/v1/workspaces/${workspaceId}`, { method: "GET" })
  );
  assert.equal(unauthRes.status, 401);

  // Authenticated member request should succeed
  const authRes = await (app as any).fetch(
    new Request(`http://127.0.0.1/api/v1/workspaces/${workspaceId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  assert.equal(authRes.status, 200);
  const authBody = await authRes.json();
  assert.equal(authBody.data.workspace.id, workspaceId);
});
