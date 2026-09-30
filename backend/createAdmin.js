const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    // =========================
    // ADMIN
    // =========================

    const adminMobile = "9000000001";
    const adminPassword = "admin123";

    const existingAdmin = await User.findOne({
      mobile: adminMobile,
    });

    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(
        adminPassword,
        12
      );

      await User.create({
        name: "Canteen Admin",
        mobile: adminMobile,
        password: hashedAdminPassword,
        role: "admin",
      });

      console.log("Admin created successfully!");
    } else {
      console.log("Admin already exists");
    }

    // =========================
    // STAFF / CHEF
    // =========================

    const staffMobile = "9000000002";
    const staffPassword = "staff123";

    const existingStaff = await User.findOne({
      mobile: staffMobile,
    });

    if (!existingStaff) {
      const hashedStaffPassword = await bcrypt.hash(
        staffPassword,
        12
      );

      await User.create({
        name: "Canteen Chef",
        mobile: staffMobile,
        password: hashedStaffPassword,
        role: "staff",
      });

      console.log("Staff/Chef created successfully!");
    } else {
      console.log("Staff already exists");
    }

    console.log("\n=================================");
    console.log("LOGIN DETAILS");
    console.log("=================================");

    console.log("\nADMIN");
    console.log("Mobile:", adminMobile);
    console.log("Password:", adminPassword);

    console.log("\nSTAFF / CHEF");
    console.log("Mobile:", staffMobile);
    console.log("Password:", staffPassword);

    console.log("\n=================================");

    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
};

createUsers();