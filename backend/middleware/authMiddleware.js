const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};










// What this does

// When someone calls a protected API:

// // Request
//    ↓
// Authorization: Bearer JWT_TOKEN
//    ↓
// authenticate()
//    ↓
// Is token valid?
//    │
//    ├── No → 401
//    │
//    └── Yes
//           ↓
//        req.user
//           ↓
//        API continues