import { prisma } from "./data/prisma.js";
async function activateUsers() {
    const result = await prisma.user.updateMany({
        where: { status: "pending_verification" },
        data: { status: "active", emailVerifiedAt: new Date() },
    });
    console.log(`Activated ${result.count} user(s)`);
    await prisma.$disconnect();
}
activateUsers().catch(console.error);
