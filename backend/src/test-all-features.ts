/**
 * GrowthCloud — Full Feature API Test Suite v2
 * Uses correct field names per each endpoint's actual schema.
 */

const BASE_URL = "http://localhost:4000";
let token = "";
let workspaceId = "";
let publicKey = "";
let leadId = "";
let templateId = "";
let campaignId = "";
let segmentId = "";
let scoringRuleId = "";
let workflowId = "";
let webhookId = "";

const results: Array<{ category: string; test: string; pass: boolean; details: string }> = [];

async function req(method: string, path: string, body?: unknown, auth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

function log(category: string, test: string, pass: boolean, details = "") {
  const icon = pass ? "" : "";
  console.log(`${icon} [${category}] ${test}${details ? " — " + details : ""}`);
  results.push({ category, test, pass, details });
}

async function run() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  GrowthCloud — Full Feature API Test Suite v2 ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ─── 1. SYSTEM ────────────────────────────────────────────
  const health = await req("GET", "/health", undefined, false);
  log("System", "GET /health", health.status === 200 && health.json.data?.status === "ok");

  const catalog = await req("GET", "/api/v1", undefined, false);
  const modules: string[] = catalog.json.data?.modules ?? [];
  log("System", "GET /api/v1 module catalog", modules.length >= 8, `Found: ${modules.join(", ")}`);

  // ─── 2. AUTH ──────────────────────────────────────────────
  const login = await req("POST", "/api/v1/auth/login", {
    email: "shubhashisbaral3@gmail.com",
    password: "Radhe@2003",
  }, false);
  log("Auth", "POST /auth/login", login.status === 200 && !!login.json.data?.accessToken);
  token = login.json.data?.accessToken ?? "";
  workspaceId = login.json.data?.user?.memberships?.[0]?.workspaceId ?? "";
  log("Auth", "Token + workspaceId extracted", !!token && !!workspaceId, `wsId: ${workspaceId}`);

  const me = await req("GET", "/api/v1/auth/me");
  log("Auth", "GET /auth/me", me.status === 200 && !!me.json.data?.user?.email, `email: ${me.json.data?.user?.email}`);

  // ─── 3. API KEYS ──────────────────────────────────────────
  // Note: scope must use "identify:write" not "identify"
  // Note: response is { apiKey: {...}, plaintextKey: "gc_pub_..." }
  const createKey = await req("POST", `/api/v1/api-keys?workspaceId=${workspaceId}`, {
    workspaceId, name: `SDK Test Key ${Date.now()}`, type: "public",
    scopes: ["events:write", "identify:write"],
  });
  const keyOk = createKey.status === 201 && !!createKey.json.data?.plaintextKey;
  log("API Keys", "POST /api-keys (create public key)", keyOk, `key: ${createKey.json.data?.plaintextKey?.slice(0, 20)}...`);
  publicKey = createKey.json.data?.plaintextKey ?? "";

  const listKeys = await req("GET", `/api/v1/api-keys?workspaceId=${workspaceId}`);
  log("API Keys", "GET /api-keys (list)", listKeys.status === 200 && Array.isArray(listKeys.json.data?.items), `count: ${listKeys.json.data?.items?.length}`);

  // ─── 4. LEADS ─────────────────────────────────────────────
  const createLead = await req("POST", `/api/v1/leads?workspaceId=${workspaceId}`, {
    workspaceId,
    email: `lead_${Date.now()}@example.com`,
    firstName: "Alice",
    lastName: "Johnson",
    company: "Acme Corp",
    source: "website",
    lifecycleStage: "mql",
    status: "active",
  });
  log("Leads", "POST /leads (create)", createLead.status === 201 && !!createLead.json.data?.id, `id: ${createLead.json.data?.id}`);
  leadId = createLead.json.data?.id ?? "";

  const listLeads = await req("GET", `/api/v1/leads?workspaceId=${workspaceId}&page=1&limit=10`);
  log("Leads", "GET /leads (paginated)", listLeads.status === 200 && Array.isArray(listLeads.json.data?.items), `items: ${listLeads.json.data?.items?.length}`);

  const getLead = await req("GET", `/api/v1/leads/${leadId}?workspaceId=${workspaceId}`);
  log("Leads", "GET /leads/:id (detail)", getLead.status === 200 && !!getLead.json.data?.email);

  const updateLead = await req("PATCH", `/api/v1/leads/${leadId}?workspaceId=${workspaceId}`, {
    lifecycleStage: "sql", score: 85,
  });
  log("Leads", "PATCH /leads/:id (update stage + score)", updateLead.status === 200 && updateLead.json.data?.lifecycleStage === "sql");

  // note field is "note" (not "content")
  const addNote = await req("POST", `/api/v1/leads/${leadId}/notes?workspaceId=${workspaceId}`, {
    note: "Hot lead — demo booked for next week",
  });
  log("Leads", "POST /leads/:id/notes (add note)", addNote.status === 201 && !!addNote.json.data?.id);

  // tags endpoint: { tag: "string" }
  const addTag = await req("POST", `/api/v1/leads/${leadId}/tags?workspaceId=${workspaceId}`, { tag: "enterprise" });
  log("Leads", "POST /leads/:id/tags (add tag)", addTag.status === 201 && !!addTag.json.data?.tag);

  // activity endpoint: GET /:leadId/activity
  const getActivity = await req("GET", `/api/v1/leads/${leadId}/activity?workspaceId=${workspaceId}`);
  log("Leads", "GET /leads/:id/activity (timeline)", getActivity.status === 200 && Array.isArray(getActivity.json.data?.activities));

  // ─── 5. EMAIL ─────────────────────────────────────────────
  // Field is "htmlContent" not "htmlBody"
  const createTemplate = await req("POST", `/api/v1/email/templates?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `Welcome Email ${Date.now()}`,
    subject: "Hello {{firstName}}!",
    htmlContent: "<p>Hi {{firstName}}, welcome to GrowthCloud!</p>",
    textContent: "Hi {{firstName}}, welcome!",
  });
  log("Email", "POST /email/templates (create)", createTemplate.status === 201 && !!createTemplate.json.data?.id, `id: ${createTemplate.json.data?.id}`);
  templateId = createTemplate.json.data?.id ?? "";

  const listTemplates = await req("GET", `/api/v1/email/templates?workspaceId=${workspaceId}`);
  const tplItems = listTemplates.json.data?.items ?? listTemplates.json.data;
  log("Email", "GET /email/templates (list)", listTemplates.status === 200 && Array.isArray(tplItems), `count: ${tplItems?.length}`);

  const createCampaign = await req("POST", `/api/v1/email/campaigns?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `Q3 Launch ${Date.now()}`,
    templateId,
    fromName: "GrowthCloud",
    fromEmail: "hello@growthcloud.io",
    subject: "Something exciting!",
    status: "draft",
  });
  log("Email", "POST /email/campaigns (create)", createCampaign.status === 201 && !!createCampaign.json.data?.id, `id: ${createCampaign.json.data?.id}`);
  campaignId = createCampaign.json.data?.id ?? "";

  const listCampaigns = await req("GET", `/api/v1/email/campaigns?workspaceId=${workspaceId}`);
  const cmpItems = listCampaigns.json.data?.items ?? listCampaigns.json.data;
  log("Email", "GET /email/campaigns (list)", listCampaigns.status === 200 && Array.isArray(cmpItems));

  // ─── 6. SEGMENTS ──────────────────────────────────────────
  const createSegment = await req("POST", `/api/v1/segments?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `Hot Leads ${Date.now()}`,
    description: "Score >= 75 + MQL/SQL",
    type: "dynamic",
    status: "active",
    rules: {
      logic: "AND",
      conditions: [
        { field: "score", operator: "gte", value: 75 },
        { field: "lifecycleStage", operator: "in", value: ["mql", "sql"] },
      ],
    },
  });
  log("Segments", "POST /segments (create dynamic)", createSegment.status === 201 && !!createSegment.json.data?.id, `id: ${createSegment.json.data?.id}`);
  segmentId = createSegment.json.data?.id ?? "";

  if (segmentId) {
    const compute = await req("POST", `/api/v1/segments/${segmentId}/compute?workspaceId=${workspaceId}`, {});
    log("Segments", "POST /segments/:id/compute", compute.status === 200, `memberCount: ${compute.json.data?.memberCount}`);
  }

  const preview = await req("POST", `/api/v1/segments/preview?workspaceId=${workspaceId}`, {
    workspaceId,
    rules: { logic: "AND", conditions: [{ field: "score", operator: "gte", value: 50 }] },
  });
  log("Segments", "POST /segments/preview", preview.status === 200, `matchCount: ${preview.json.data?.matchCount}`);

  const listSegments = await req("GET", `/api/v1/segments?workspaceId=${workspaceId}`);
  const segItems = listSegments.json.data?.items ?? listSegments.json.data;
  log("Segments", "GET /segments (list)", listSegments.status === 200 && Array.isArray(segItems));

  // ─── 7. SCORING ───────────────────────────────────────────
  const createRule = await req("POST", `/api/v1/scoring/rules?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `SQL Bonus ${Date.now()}`,
    description: "Lead moves to SQL",
    type: "positive",
    condition: { field: "lifecycleStage", operator: "eq", value: "sql" },
    points: 25,
    isActive: true,
  });
  log("Scoring", "POST /scoring/rules (create)", createRule.status === 201 && !!createRule.json.data?.id, `id: ${createRule.json.data?.id}`);

  // Scoring rules list returns { rules: [...], stats: {...} }
  const listRules = await req("GET", `/api/v1/scoring/rules?workspaceId=${workspaceId}`);
  log("Scoring", "GET /scoring/rules (list)", listRules.status === 200 && Array.isArray(listRules.json.data?.rules), `count: ${listRules.json.data?.rules?.length}`);

  const aiHints = await req("GET", `/api/v1/scoring/ai-hints?workspaceId=${workspaceId}`);
  log("Scoring", "GET /scoring/ai-hints (AI suggestions)", aiHints.status === 200 && Array.isArray(aiHints.json.data?.hints ?? aiHints.json.data));

  const recalc = await req("POST", `/api/v1/scoring/recalculate?workspaceId=${workspaceId}`, { workspaceId });
  log("Scoring", "POST /scoring/recalculate", recalc.status === 200 && "updated" in (recalc.json.data ?? {}), `updated: ${recalc.json.data?.updated}`);

  // ─── 8. WORKFLOWS ─────────────────────────────────────────
  // definition requires { trigger: { type: "..." }, steps: [...] }
  const createWorkflow = await req("POST", `/api/v1/workflows?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `Sales Alert ${Date.now()}`,
    description: "Notify sales when score crosses threshold",
    status: "active",
    triggerType: "lead_score_threshold",
    definition: {
      trigger: { type: "lead_score_threshold", config: { threshold: 80 } },
      steps: [
        { index: 0, type: "condition", conditionField: "score", conditionOperator: "gte", conditionValue: 80 },
        { index: 1, type: "action", actionType: "notify_sales", config: { message: "Hot lead!" } },
        { index: 2, type: "action", actionType: "add_tag", config: { tag: "sales-ready" } },
      ],
    },
  });
  log("Workflows", "POST /workflows (create with trigger+steps)", createWorkflow.status === 201 && !!createWorkflow.json.data?.id, `id: ${createWorkflow.json.data?.id}`);
  workflowId = createWorkflow.json.data?.id ?? "";

  const listWorkflows = await req("GET", `/api/v1/workflows?workspaceId=${workspaceId}`);
  log("Workflows", "GET /workflows (list)", listWorkflows.status === 200 && Array.isArray(listWorkflows.json.data?.items));

  if (workflowId && leadId) {
    const trigger = await req("POST", `/api/v1/workflows/${workflowId}/trigger?workspaceId=${workspaceId}`, {
      leadId, input: { manualTrigger: true },
    });
    log("Workflows", "POST /workflows/:id/trigger (manual run)", trigger.status === 200);

    const runs = await req("GET", `/api/v1/workflows/${workflowId}/runs?workspaceId=${workspaceId}`);
    log("Workflows", "GET /workflows/:id/runs (history)", runs.status === 200 && Array.isArray(runs.json.data?.items));
  }

  // ─── 9. WEBHOOKS ──────────────────────────────────────────
  const createWebhook = await req("POST", `/api/v1/webhooks?workspaceId=${workspaceId}`, {
    workspaceId,
    name: `CRM Sync ${Date.now()}`,
    targetUrl: "https://httpbin.org/post",
    events: ["lead.created", "lead.score_changed"],
  });
  log("Webhooks", "POST /webhooks (create subscription)", createWebhook.status === 201 && !!createWebhook.json.data?.id, `id: ${createWebhook.json.data?.id}`);
  webhookId = createWebhook.json.data?.id ?? "";

  const listWebhooks = await req("GET", `/api/v1/webhooks?workspaceId=${workspaceId}`);
  log("Webhooks", "GET /webhooks (list)", listWebhooks.status === 200 && Array.isArray(listWebhooks.json.data?.items));

  if (webhookId) {
    // Fix: workspaceId must be in query param (not body) to avoid middleware confusion
    const rotateSecret = await req("POST", `/api/v1/webhooks/${webhookId}/rotate-secret?workspaceId=${workspaceId}`, {});
    log("Webhooks", "POST /webhooks/:id/rotate-secret", rotateSecret.status === 200 && !!rotateSecret.json.data?.secret, `has_secret: ${!!rotateSecret.json.data?.secret}`);

    const deliveries = await req("GET", `/api/v1/webhooks/${webhookId}/deliveries?workspaceId=${workspaceId}`);
    log("Webhooks", "GET /webhooks/:id/deliveries (log)", deliveries.status === 200 && "items" in (deliveries.json.data ?? {}));
  }

  const testDispatch = await req("POST", `/api/v1/webhooks/test-dispatch?workspaceId=${workspaceId}`, {
    event: "lead.created",
    payload: { leadId, email: "test@growthcloud.io" },
  });
  log("Webhooks", "POST /webhooks/test-dispatch", testDispatch.status === 200 && "dispatchedCount" in (testDispatch.json.data ?? {}), `dispatched: ${testDispatch.json.data?.dispatchedCount}`);

  // ─── 10. ANALYTICS ────────────────────────────────────────
  const analytics7d = await req("GET", `/api/v1/analytics/overview?workspaceId=${workspaceId}&range=7d`);
  log("Analytics", "GET /analytics/overview?range=7d", analytics7d.status === 200 && !!analytics7d.json.data?.leadMetrics);

  const analytics30d = await req("GET", `/api/v1/analytics/overview?workspaceId=${workspaceId}&range=30d`);
  log("Analytics", "GET /analytics/overview?range=30d (AI insights)", analytics30d.status === 200, `insights: ${analytics30d.json.data?.aiInsights?.length}`);

  const exportCsv = await req("GET", `/api/v1/analytics/export?workspaceId=${workspaceId}&format=csv&range=7d`);
  log("Analytics", "GET /analytics/export (CSV)", exportCsv.status === 200);

  const exportJson = await req("GET", `/api/v1/analytics/export?workspaceId=${workspaceId}&format=json&range=30d`);
  log("Analytics", "GET /analytics/export (JSON)", exportJson.status === 200);

  // ─── 11. SDK ──────────────────────────────────────────────
  if (publicKey) {
    const sdkIdentify = await fetch(`${BASE_URL}/api/v1/sdk/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-GrowthCloud-Public-Key": publicKey },
      body: JSON.stringify({ email: `sdk_${Date.now()}@acme.com`, traits: { firstName: "SDK", company: "Acme Inc" } }),
    });
    const sdkIdJson = await sdkIdentify.json().catch(() => ({}));
    log("SDK", "POST /sdk/identify (lead upsert)", sdkIdentify.status === 200 && sdkIdJson.data?.identified === true, `leadId: ${sdkIdJson.data?.leadId}`);

    const sdkTrack = await fetch(`${BASE_URL}/api/v1/sdk/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-GrowthCloud-Public-Key": publicKey },
      body: JSON.stringify({ event: "demo_requested", properties: { plan: "enterprise" } }),
    });
    const sdkTrackJson = await sdkTrack.json().catch(() => ({}));
    log("SDK", "POST /sdk/track (event tracking)", sdkTrack.status === 200 && sdkTrackJson.data?.tracked === true);

    const sdkForm = await fetch(`${BASE_URL}/api/v1/sdk/form`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-GrowthCloud-Public-Key": publicKey },
      body: JSON.stringify({ formId: "contact_form", data: { email: `form_${Date.now()}@test.com`, name: "Test" } }),
    });
    const sdkFormJson = await sdkForm.json().catch(() => ({}));
    log("SDK", "POST /sdk/form (form capture)", sdkForm.status === 200 && sdkFormJson.data?.captured === true);

    const sdkSync = await fetch(`${BASE_URL}/api/v1/sdk/lead-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-GrowthCloud-Public-Key": publicKey },
      body: JSON.stringify({ email: `sync_${Date.now()}@crm.com`, data: { firstName: "CRM", company: "External Corp" } }),
    });
    const sdkSyncJson = await sdkSync.json().catch(() => ({}));
    log("SDK", "POST /sdk/lead-sync (flat format)", sdkSync.status === 200 && sdkSyncJson.data?.synced === true);
  } else {
    log("SDK", "SDK tests (skipped - no public key)", false, "API key creation failed");
  }

  // ─── SUMMARY ──────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  RESULTS: ${passed}/${total} passed  |  ${failed} failed`);
  console.log(`╚══════════════════════════════════════════════╝`);

  if (failed > 0) {
    console.log("\n FAILED TESTS:");
    results.filter(r => !r.pass).forEach(r => console.log(`  [${r.category}] ${r.test} — ${r.details}`));
  } else {
    console.log("\n ALL TESTS PASSED!");
  }

  console.log("\n Module Coverage:");
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(cat => {
    const catRes = results.filter(r => r.category === cat);
    const ok = catRes.filter(r => r.pass).length;
    const icon = ok === catRes.length ? "✅" : ok > 0 ? "⚠️ " : "❌";
    console.log(`  ${icon} ${cat}: ${ok}/${catRes.length}`);
  });
}

run().catch(console.error);
