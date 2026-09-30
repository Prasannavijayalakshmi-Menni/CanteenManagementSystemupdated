console.log("✅ AUTH ROUTES LOADED");

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;

    // Check required fields
    if (!name || !mobile || !password || !role) {
      return res.status(400).json({
        message: "Name, mobile, password and role are required",
      });
    }

    // Check role
    if (!["user", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Validate mobile
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check existing mobile
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(400).json({
        message: "Mobile number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: `${role.toUpperCase()} registration successful`,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { mobile, password, role } = req.body;

    if (!mobile || !password || !role) {
      return res.status(400).json({
        message: "Mobile, password and role are required",
      });
    }

    // Validate selected login role
    if (!["user", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Find account using mobile ONLY
    // We check the actual account role below.
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(401).json({
        message: "Invalid mobile number or password",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid mobile number or password",
      });
    }

    // =================================================
    // ROLE LOGIN PERMISSIONS
    // =================================================
    //
    // Actual account role     Allowed login roles
    //
    // user                     user
    // staff                    user, staff
    // admin                    user, staff, admin
    //

    let allowedRoles = [];

    if (user.role === "user") {
      allowedRoles = ["user"];
    }

    if (user.role === "staff") {
      allowedRoles = ["user", "staff"];
    }

    if (user.role === "admin") {
      allowedRoles = ["user", "staff", "admin"];
    }

    // Selected role is not allowed for this account
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `This account cannot login as ${role}`,
      });
    }

    // =================================================
    // CREATE JWT
    // =================================================
    //
    // IMPORTANT:
    // Store the SELECTED login role in JWT.
    // This determines which dashboard opens.
    //

    const token = jwt.sign(
      {
        userId: user._id,
        role: role,
        actualRole: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // =================================================
    // RESPONSE
    // =================================================

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,

        // Selected role controls the dashboard
        role: role,

        // Actual database role is also available
        actualRole: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});


// =====================================================
// CURRENT USER
// =====================================================

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -resetOtp -resetOtpExpiry"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
});


// =====================================================
// ADMIN TEST
// =====================================================

router.get(
  "/admin-test",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Admin access successful",
      user: req.user,
    });
  }
);


module.exports = router;