
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/config/db");

const createAdmin = async () => {
    try {
        const name = process.env.ADMIN_NAME?.trim();
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
            );
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters");
        }

        await connectDB();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error(
                "This email already exists. No account or role was changed."
            );
        }

        await User.create({
            name,
            email,
            password,
            role: "ADMIN",
            isEmailVerified: true
        });

        console.log("Admin account created successfully.");
        console.log(`Admin email: ${email}`);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();