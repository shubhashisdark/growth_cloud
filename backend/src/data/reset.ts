import bcrypt from "bcryptjs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { prisma } from "./prisma.js";

async function hashPassword(value: string) {
  return bcrypt.hash(value, 10);
}

async function ensureDatabaseDirectoryExists() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.startsWith("file:")) {
    return;
  }

  const databasePath = databaseUrl.slice("file:".length).split("?")[0];
  if (!databasePath) {
    return;
  }

  await mkdir(dirname(databasePath), { recursive: true });
}

export async function resetDatabase() {
  await ensureDatabaseDirectoryExists();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        id: "usr_sarah",
        name: "Sarah Kim",
        email: "sarah@example.com",
        passwordHash: await hashPassword("Password123!")
      },
      {
        id: "usr_marketer",
        name: "Mia Lopez",
        email: "marketer@example.com",
        passwordHash: await hashPassword("marketerpass")
      }
    ]
  });

  await prisma.workspace.create({
    data: {
      id: "ws_demo",
      name: "Acme Growth",
      slug: "acme-growth",
      plan: "trial",
      timezone: "Asia/Kolkata",
      status: "active",
      ownerId: "usr_sarah"
    }
  });

  await prisma.workspaceMember.createMany({
    data: [
      {
        id: "wm_demo_owner",
        workspaceId: "ws_demo",
        userId: "usr_sarah",
        role: "super_admin"
      },
      {
        id: "wm_demo_marketer",
        workspaceId: "ws_demo",
        userId: "usr_marketer",
        role: "marketer"
      }
    ]
  });

  await prisma.apiKey.createMany({
    data: [
      {
        id: "key_001",
        workspaceId: "ws_demo",
        name: "Primary Secret Key",
        prefix: "gc_live_ab12cd34",
        keyHash: "seeded-key-hash-1",
        type: "secret",
        status: "active",
        scopesJson: JSON.stringify(["leads:read", "leads:write", "workflows:read"])
      },
      {
        id: "key_002",
        workspaceId: "ws_demo",
        name: "Website Public Key",
        prefix: "gc_pub_zx98yu76",
        keyHash: "seeded-key-hash-2",
        type: "public",
        status: "active",
        scopesJson: JSON.stringify(["events:write", "identify:write"])
      }
    ]
  });

  await prisma.segment.createMany({
    data: [
      {
        id: "seg_high_intent",
        workspaceId: "ws_demo",
        name: "High Intent",
        type: "dynamic",
        status: "active",
        rulesJson: JSON.stringify({ minScore: 70 })
      },
      {
        id: "seg_trial",
        workspaceId: "ws_demo",
        name: "Trial Users",
        type: "dynamic",
        status: "active",
        rulesJson: JSON.stringify({ lifecycleStage: ["mql"] })
      }
    ]
  });

  await prisma.workflow.createMany({
    data: [
      {
        id: "wf_001",
        workspaceId: "ws_demo",
        name: "Welcome Sequence",
        status: "active",
        triggerType: "lead.created",
        stepCount: 4,
        definitionJson: JSON.stringify({ steps: ["delay", "email", "delay", "email"] }),
        lastRunAt: new Date("2026-07-29T07:50:00.000Z")
      },
      {
        id: "wf_002",
        workspaceId: "ws_demo",
        name: "Trial Nurture",
        status: "active",
        triggerType: "trial.started",
        stepCount: 5,
        definitionJson: JSON.stringify({ steps: ["email", "delay", "condition", "email", "notify"] }),
        lastRunAt: new Date("2026-07-29T07:55:00.000Z")
      }
    ]
  });

  await prisma.lead.createMany({
    data: [
      {
        id: "lead_001",
        workspaceId: "ws_demo",
        email: "james@northwind.com",
        firstName: "James",
        lastName: "Davidson",
        company: "Northwind",
        source: "Google Ads",
        status: "active",
        score: 87,
        lifecycleStage: "sql"
      },
      {
        id: "lead_002",
        workspaceId: "ws_demo",
        email: "emily@omnilabs.io",
        firstName: "Emily",
        lastName: "Watson",
        company: "OmniLabs",
        source: "Organic",
        status: "active",
        score: 64,
        lifecycleStage: "mql"
      }
    ]
  });

  await prisma.leadActivity.createMany({
    data: [
      {
        id: "act_001",
        leadId: "lead_001",
        workspaceId: "ws_demo",
        activityType: "pricing.viewed",
        description: "Viewed pricing page"
      },
      {
        id: "act_002",
        leadId: "lead_002",
        workspaceId: "ws_demo",
        activityType: "trial.started",
        description: "Started trial"
      }
    ]
  });
}
