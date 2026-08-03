import { prisma } from "../../../data/prisma.js";

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Parameters<typeof prisma.user.create>[0]["data"]) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Parameters<typeof prisma.user.update>[0]["data"]) {
    return prisma.user.update({ where: { id }, data });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { memberships: true } });
  }
}
