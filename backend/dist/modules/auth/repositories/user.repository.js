import { prisma } from "../../../data/prisma.js";
export class UserRepository {
    async findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }
    async create(data) {
        return prisma.user.create({ data });
    }
    async update(id, data) {
        return prisma.user.update({ where: { id }, data });
    }
    async findById(id) {
        return prisma.user.findUnique({ where: { id }, include: { memberships: true } });
    }
}
