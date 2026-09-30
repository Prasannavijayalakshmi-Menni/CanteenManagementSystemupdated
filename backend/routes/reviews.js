const express = require("express");
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// SUBMIT REVIEW
// POST /api/reviews
// ======================================================

router.post(
    "/",
    authenticate,
    authorize("user"),
    async (req, res) => {
        try {
            const {
                orderId,
                menuItemId,
                rating,
                comment,
            } = req.body;

            // ----------------------------------------------
            // Validate required fields
            // ----------------------------------------------

            if (!orderId || !menuItemId || rating === undefined) {
                return res.status(400).json({
                    message:
                        "orderId, menuItemId and rating are required.",
                });
            }

            // ----------------------------------------------
            // Validate ObjectIds
            // ----------------------------------------------

            if (
                !mongoose.Types.ObjectId.isValid(orderId) ||
                !mongoose.Types.ObjectId.isValid(menuItemId)
            ) {
                return res.status(400).json({
                    message: "Invalid order or food ID.",
                });
            }

            // ----------------------------------------------
            // Validate rating
            // ----------------------------------------------

            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return res.status(400).json({
                    message:
                        "Rating must be a whole number between 1 and 5.",
                });
            }

            // ----------------------------------------------
            // Find user's order
            // ----------------------------------------------

            const order = await Order.findOne({
                _id: orderId,
                userId: req.user.userId,
            });

            if (!order) {
                return res.status(404).json({
                    message:
                        "Order not found or you are not allowed to review this order.",
                });
            }

            // ----------------------------------------------
            // Review only completed orders
            // ----------------------------------------------

            if (order.status !== "Served") {
                return res.status(400).json({
                    message:
                        "You can review food only after the order is served.",
                });
            }

            // ----------------------------------------------
            // Check food exists
            // ----------------------------------------------

            const menuItem = await MenuItem.findById(
                menuItemId
            );

            if (!menuItem) {
                return res.status(404).json({
                    message: "Food item not found.",
                });
            }

            // ----------------------------------------------
            // Check food was actually part of the order
            // ----------------------------------------------

            const orderedItem = order.items.find(
                (item) =>
                    item.menuItemId.toString() ===
                    menuItemId.toString()
            );

            if (!orderedItem) {
                return res.status(400).json({
                    message:
                        "You can review only food items from this order.",
                });
            }

            // ----------------------------------------------
            // Check duplicate review
            // ----------------------------------------------

            const existingReview =
                await Review.findOne({
                    userId: req.user.userId,
                    orderId,
                    menuItemId,
                });

            if (existingReview) {
                return res.status(409).json({
                    message:
                        "You have already reviewed this food for this order.",
                    review: existingReview,
                });
            }

            // ----------------------------------------------
            // Create review
            // ----------------------------------------------

            const review = await Review.create({
                userId: req.user.userId,
                orderId,
                menuItemId,
                rating: numericRating,
                comment:
                    typeof comment === "string"
                        ? comment.trim()
                        : "",
            });

            // ----------------------------------------------
            // Return populated review
            // ----------------------------------------------

            const populatedReview =
                await Review.findById(review._id)
                    .populate("userId", "name")
                    .populate("menuItemId", "name");

            return res.status(201).json({
                message: "Review submitted successfully.",
                review: populatedReview,
            });
        } catch (error) {
            console.error(
                "Submit review error:",
                error
            );

            // MongoDB duplicate-key protection
            if (error.code === 11000) {
                return res.status(409).json({
                    message:
                        "You have already reviewed this food for this order.",
                });
            }

            return res.status(500).json({
                message:
                    "Unable to submit review.",
            });
        }
    }
);


// ======================================================
// GET REVIEWS FOR A FOOD
// GET /api/reviews/food/:menuItemId
// ======================================================

router.get(
    "/food/:menuItemId",
    async (req, res) => {
        try {
            const { menuItemId } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    menuItemId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid food ID.",
                });
            }

            const reviews = await Review.find({
                menuItemId,
            })
                .populate("userId", "name")
                .sort({ createdAt: -1 });

            // ----------------------------------------------
            // Calculate average rating
            // ----------------------------------------------

            const totalReviews = reviews.length;

            const totalRating = reviews.reduce(
                (sum, review) =>
                    sum + review.rating,
                0
            );

            const averageRating =
                totalReviews > 0
                    ? Number(
                        (
                            totalRating /
                            totalReviews
                        ).toFixed(1)
                    )
                    : 0;

            return res.json({
                menuItemId,
                averageRating,
                totalReviews,
                reviews,
            });
        } catch (error) {
            console.error(
                "Get food reviews error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load food reviews.",
            });
        }
    }
);


// ======================================================
// GET MY REVIEWS
// GET /api/reviews/my
// ======================================================

router.get(
    "/my",
    authenticate,
    authorize("user"),
    async (req, res) => {
        try {
            const reviews = await Review.find({
                userId: req.user.userId,
            })
                .populate(
                    "menuItemId",
                    "name image price"
                )
                .populate(
                    "orderId",
                    "orderNumber status"
                )
                .sort({ createdAt: -1 });

            return res.json({
                reviews,
            });
        } catch (error) {
            console.error(
                "Get my reviews error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load your reviews.",
            });
        }
    }
);


// ======================================================
// GET REVIEWS FOR AN ORDER
// GET /api/reviews/order/:orderId
// ======================================================

router.get(
    "/order/:orderId",
    authenticate,
    async (req, res) => {
        try {
            const { orderId } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                return res.status(400).json({
                    message: "Invalid order ID.",
                });
            }

            // ----------------------------------------------
            // Find order
            // ----------------------------------------------

            const order =
                await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    message: "Order not found.",
                });
            }

            // ----------------------------------------------
            // User can only see own order reviews
            // Staff/Admin can see any order
            // ----------------------------------------------

            const isOwner =
                order.userId.toString() ===
                req.user.userId.toString();

            const isStaffOrAdmin =
                ["staff", "admin"].includes(
                    req.user.role
                );

            if (
                !isOwner &&
                !isStaffOrAdmin
            ) {
                return res.status(403).json({
                    message:
                        "You are not allowed to view these reviews.",
                });
            }

            const reviews =
                await Review.find({
                    orderId,
                })
                    .populate(
                        "userId",
                        "name"
                    )
                    .populate(
                        "menuItemId",
                        "name image price"
                    )
                    .sort({ createdAt: -1 });

            return res.json({
                reviews,
            });
        } catch (error) {
            console.error(
                "Get order reviews error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load order reviews.",
            });
        }
    }
);


module.exports = router;