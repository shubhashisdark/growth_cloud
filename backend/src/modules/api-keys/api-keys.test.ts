import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/services/auth.service.js";
import { createApiKey, rotateApiKey, revokeApiKey, authenticateApiKey, getApiKeyUsage } from "./api-key.service.js";

test("ApiKeyService - full key lifecycle & authentication", async () => {
  const authService = new AuthService();
  const ownerEmail = `key_owner_${Date.now()}@example.com`;

  const signupRes = await authService.signup({
    name: "Key Owner",
    email: ownerEmail,
    password: "Password123!",
    workspaceName: "API Key Test Workspace"
  });

  const actorId = signupRes.data!.user.id;
  const workspaceId = signupRes.data!.workspace.id;

  // 1. Create Secret Key
  const secretKeyRes = await createApiKey({
    workspaceId,
    actorId,
    name: "Live Secret Key",
    type: "secret",
    scopes: ["events:write", "identify:write"]
  });

  assert.ok(secretKeyRes.apiKey.id);
  assert.ok(secretKeyRes.plaintextKey.startsWith("gc_live_"));
  assert.equal(secretKeyRes.apiKey.type, "secret");

  // 2. Create Public Key
  const publicKeyRes = await createApiKey({
    workspaceId,
    actorId,
    name: "Public Browser Key",
    type: "public",
    scopes: ["events:write"]
  });

  assert.ok(publicKeyRes.plaintextKey.startsWith("gc_pub_"));
  assert.equal(publicKeyRes.apiKey.type, "public");

  // 3. Authenticate Secret Key
  const authRes = await authenticateApiKey(`Bearer ${secretKeyRes.plaintextKey}`);
  assert.ok(authRes);
  assert.equal(authRes?.apiKey.id, secretKeyRes.apiKey.id);

  // 4. Rotate Key
  const rotateRes = await rotateApiKey({ workspaceId, actorId, apiKeyId: secretKeyRes.apiKey.id });
  assert.ok(rotateRes.plaintextKey);
  assert.notEqual(rotateRes.plaintextKey, secretKeyRes.plaintextKey);

  // Old key fails auth
  const oldAuthRes = await authenticateApiKey(`Bearer ${secretKeyRes.plaintextKey}`);
  assert.equal(oldAuthRes, null);

  // New key succeeds auth
  const newAuthRes = await authenticateApiKey(`Bearer ${rotateRes.plaintextKey}`);
  assert.ok(newAuthRes);

  // 5. Revoke Key
  const revokeRes = await revokeApiKey({ workspaceId, actorId, apiKeyId: secretKeyRes.apiKey.id, reason: "Security rotation" });
  assert.equal(revokeRes?.status, "revoked");

  // Revoked key fails auth
  const revokedAuthRes = await authenticateApiKey(`Bearer ${rotateRes.plaintextKey}`);
  assert.equal(revokedAuthRes, null);
});

test("API Keys HTTP routes - create, authenticate, and usage telemetry", async () => {
  const app = createApp();
  const email = `key_http_${Date.now()}@example.com`;

  // Signup owner
  const signupRes = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "HTTP Key Admin",
        email,
        password: "Password123!",
        workspaceName: "HTTP Key Workspace"
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
      body: JSON.stringify({ email, password: "Password123!" })
    })
  );
  const loginBody = await loginRes.json();
  const token = loginBody.data.accessToken;

  // Create API Key via HTTP
  const createKeyRes = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/api-keys", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Workspace-Id": workspaceId
      },
      body: JSON.stringify({
        name: "SDK Production Key",
        type: "secret",
        scopes: ["events:write", "identify:write"]
      })
    })
  );

  const createKeyBody = await createKeyRes.json();
  assert.equal(createKeyRes.status, 201);
  assert.ok(createKeyBody.data.plaintextKey);
  const apiKey = createKeyBody.data.apiKey;
  const plaintextKey = createKeyBody.data.plaintextKey;

  // Authenticate Key via HTTP
  const authKeyRes = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/api-keys/authenticate", {
      method: "POST",
      headers: { Authorization: `Bearer ${plaintextKey}` }
    })
  );
  const authKeyBody = await authKeyRes.json();
  assert.equal(authKeyRes.status, 200);
  assert.equal(authKeyBody.data.authenticated, true);

  // Track Usage via HTTP
  const trackRes = await (app as any).fetch(
    new Request(`http://127.0.0.1/api/v1/api-keys/${apiKey.id}/usage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${plaintextKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: "/api/v1/events",
        method: "POST",
        statusCode: 200,
        responseTimeMs: 45,
        ipAddress: "127.0.0.1",
        userAgent: "GrowthCloud-NodeSDK/1.0"
      })
    })
  );
  const trackBody = await trackRes.json();
  assert.equal(trackRes.status, 201);
  assert.equal(trackBody.data.tracked, true);
});
