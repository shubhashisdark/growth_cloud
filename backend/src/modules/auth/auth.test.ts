import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";
import { AuthService } from "./services/auth.service.js";

test("AuthService - signup, login, me flow", async () => {
  const service = new AuthService();
  const email = `test_${Date.now()}@example.com`;

  // 1. Signup
  const signupRes = await service.signup({
    name: "Test User",
    email,
    password: "Password123!",
    workspaceName: "Test Workspace"
  });

  assert.equal(signupRes.status, 201);
  assert.ok(signupRes.data?.user.id);
  assert.ok(signupRes.data?.workspace.id);

  // 2. Login
  const loginRes = await service.login({
    email,
    password: "Password123!"
  });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.data?.accessToken);
  assert.ok(loginRes.data?.refreshToken);

  // 3. Me
  const meRes = await service.me(loginRes.data!.user.id);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data?.user.email, email);
});

test("Auth HTTP routes - POST /api/v1/auth/signup & login", async () => {
  const app = createApp();
  const email = `http_test_${Date.now()}@example.com`;

  // Signup HTTP
  const signupResponse = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "HTTP User",
        email,
        password: "Password123!",
        workspaceName: "HTTP Workspace"
      })
    })
  );

  const signupBody = await signupResponse.json();
  assert.equal(signupResponse.status, 200);
  assert.equal(signupBody.error, null);
  assert.ok(signupBody.data.user);

  // Login HTTP
  const loginResponse = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "Password123!"
      })
    })
  );

  const loginBody = await loginResponse.json();
  assert.equal(loginResponse.status, 200);
  assert.ok(loginBody.data.accessToken);

  // Me HTTP with bearer token
  const meResponse = await (app as any).fetch(
    new Request("http://127.0.0.1/api/v1/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${loginBody.data.accessToken}` }
    })
  );

  const meBody = await meResponse.json();
  assert.equal(meResponse.status, 200);
  assert.equal(meBody.data.user.email, email);
});
