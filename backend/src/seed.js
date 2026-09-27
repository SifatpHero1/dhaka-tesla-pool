const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // আগের ডাটা ক্লিয়ার করা (যাতে ডুপ্লিকেট না হয়)
    await prisma.poolMembership.deleteMany();
    await prisma.poolRide.deleteMany();
    await prisma.tesla.deleteMany();
    await prisma.user.deleteMany();

    // ড্রাইভার এবং টেসলা (Bullet) তৈরি
    const jashim = await prisma.user.create({
        data: {
            name: "Jashim",
            phone: "01711111111",
            role: "DRIVER",
            tesla: { create: { name: "Bullet", capacity: 3, isOnline: true } },
        },
    });

    // প্যাসেঞ্জার তৈরি
    const nusrat = await prisma.user.create({ data: { name: "Nusrat", phone: "01811111111", role: "PASSENGER" } });
    const rafiq = await prisma.user.create({ data: { name: "Rafiq", phone: "01911111111", role: "PASSENGER" } });
    const shirin = await prisma.user.create({ data: { name: "Shirin", phone: "01611111111", role: "PASSENGER" } });

    // একটি অ্যাক্টিভ পুল রাইড তৈরি (Nusrat এবং Rafiq ইতিমধ্যে বুক করা আছে)
    await prisma.poolRide.create({
        data: {
            teslaId: jashim.tesla.id,
            status: "MATCHED",
            members: {
                create: [
                    {
                        userId: nusrat.id,
                        pickup: "Banani Road 11",
                        destination: "Mohakhali",
                        fare: 15000,
                        status: "MATCHED",
                    },
                    {
                        userId: rafiq.id,
                        pickup: "Banani Road 11",
                        destination: "Gulshan 1",
                        fare: 12000,
                        status: "MATCHED",
                    },
                ],
            },
        },
    });

    console.log("✅ Seed data inserted: Jashim (Bullet), Nusrat, Rafiq, Shirin");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
