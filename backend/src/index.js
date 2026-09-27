const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();

// ১. সব ইউজার এবং রাইডের ডাটা দেখার জন্য (ফ্রন্টএন্ডের জন্য)
app.get("/api/demo-data", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                tesla: { include: { poolRides: { include: { members: { include: { user: true } } } } } },
                memberships: { include: { poolRide: true } },
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ২. প্যাসেঞ্জার রাইড রিকোয়েস্ট করা (Auto-initialization + Concurrency হ্যান্ডলিং সহ)
app.post("/api/rides/request", async (req, res) => {
    const { userId, pickup, destination, fare } = req.body;

    try {
        const result = await prisma.$transaction(async tx => {
            // ধাপ ১: প্রথমে দেখো কোনো এক্টিভ রাইড আছে কিনা
            let activeRide = await tx.poolRide.findFirst({
                where: { tesla: { isOnline: true }, status: { in: ["REQUESTED", "MATCHED"] } },
                include: { members: true, tesla: true },
            });

            // ধাপ ২: যদি কোনো এক্টিভ রাইড না থাকে (ডাটাবেস খালি), অটোমেটিক একটি নতুন রাইড তৈরি করো!
            if (!activeRide) {
                const onlineTesla = await tx.tesla.findFirst({
                    where: { isOnline: true },
                });

                if (!onlineTesla) {
                    throw new Error("No online Tesla available. Please ask Jashim to go online!");
                }

                activeRide = await tx.poolRide.create({
                    data: {
                        teslaId: onlineTesla.id,
                        status: "REQUESTED",
                    },
                    include: { members: true, tesla: true },
                });
            }

            // ধাপ ৩: কনকারেন্সি চেক: সিট ফুল কিনা (৩ এর বেশি হতে পারবে না)
            if (activeRide.members.length >= activeRide.tesla.capacity) {
                throw new Error("Tesla is full! Concurrency conflict avoided.");
            }

            // ধাপ ৪: নতুন প্যাসেঞ্জার যোগ করা (user: true যুক্ত করা হয়েছে যাতে ফ্রন্টএন্ডে নাম দেখা যায়)
            const membership = await tx.poolMembership.create({
                data: {
                    userId,
                    poolRideId: activeRide.id,
                    pickup,
                    destination,
                    fare,
                    status: "MATCHED",
                },
                include: { user: true },
            });

            // ধাপ ৫: রাইড স্ট্যাটাস আপডেট করা
            if (activeRide.status === "REQUESTED") {
                await tx.poolRide.update({
                    where: { id: activeRide.id },
                    data: { status: "MATCHED" },
                });
            }

            return membership;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ৩. ড্রাইভার রাইডের স্ট্যাটাস আপডেট করা
app.post("/api/rides/:id/status", async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["DRIVER_ARRIVED", "STARTED", "COMPLETED", "CANCELLED"];

    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    try {
        const updatedRide = await prisma.poolRide.update({
            where: { id: req.params.id },
            data: { status },
            include: { members: true },
        });

        if (status === "COMPLETED" || status === "CANCELLED") {
            await prisma.poolMembership.updateMany({
                where: { poolRideId: req.params.id },
                data: { status },
            });
        }

        res.json({ success: true, data: updatedRide });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
