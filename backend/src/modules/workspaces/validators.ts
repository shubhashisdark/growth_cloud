import { z } from "zod";

const roleEnum = z.enum(["super_admin", "admin", "marketer", "developer", "sales", "viewer"]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(50).optional(),
  timezone: z.string().trim().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().min(2).max(50).optional(),
  timezone: z.string().trim().optional(),
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: roleEnum,
});

export const updateMemberRoleSchema = z.object({
  role: roleEnum,
});

export const sendInvitationSchema = z.object({
  email: z.string().trim().email(),
  role: roleEnum,
});
