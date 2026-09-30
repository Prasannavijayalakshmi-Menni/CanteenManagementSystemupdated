const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
==================================================
CREATE ORDER
USER ONLY
POST /api/orders
==================================================
*/

router.post(
    "/",
    authenticate,
    authorize("user"),
    async (req, res) => {
        try {
            const {
                items,
                paymentMethod = "Cash",
                specialRequests = "",
            } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    message: "Cart is empty",
                });
            }

            if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
                return res.status(400).json({
                    message: "Invalid payment method",
                });
            }

            const processedItems = [];
            const stockChanges = [];

            /*
            --------------------------------------------
            Validate every menu item first
            --------------------------------------------
            */

            for (const cartItem of items) {
                const { menuItemId, quantity } = cartItem;

                if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                    return res.status(400).json({
                        message: "Invalid menu item ID",
                    });
                }

                if (!Number.isInteger(quantity) || quantity < 1) {
                    return res.status(400).json({
                        message: "Invalid quantity",
                    });
                }

                const menuItem = await MenuItem.findById(menuItemId);

                if (!menuItem) {
                    return res.status(404).json({
                        message: `Menu item not found: ${menuItemId}`,
                    });
                }

                if (!menuItem.available) {
                    return res.status(400).json({
                        message: `${menuItem.name} is currently unavailable`,
                    });
                }

                if (menuItem.stock < quantity) {
                    return res.status(400).json({
                        message: `${menuItem.name} has only ${menuItem.stock} item(s) available`,
                    });
                }

                processedItems.push({
                    menuItemId: menuItem._id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity,
                    subtotal: menuItem.price * quantity,
                    image: menuItem.image || "",
                });
            }

            /*
            --------------------------------------------
            Calculate total on SERVER
            --------------------------------------------
            */

            const totalAmount = processedItems.reduce(
                (total, item) => total + item.subtotal,
                0
            );

            /*
            --------------------------------------------
            Reduce stock
            --------------------------------------------
            */

            try {
                for (const item of processedItems) {
                    const updatedMenuItem = await MenuItem.findOneAndUpdate(
                        {
                            _id: item.menuItemId,
                            available: true,
                            stock: { $gte: item.quantity },
                        },
                        {
                            $inc: {
                                stock: -item.quantity,
                            },
                        },
                        {
                            new: true,
                        }
                    );

                    if (!updatedMenuItem) {
                        throw new Error(
                            `${item.name} is no longer available in the requested quantity`
                        );
                    }

                    stockChanges.push({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                    });
                }
            } catch (stockError) {
                /*
                ------------------------------------------
                Roll back stock if something fails
                ------------------------------------------
                */

                for (const change of stockChanges) {
                    await MenuItem.findByIdAndUpdate(
                        change.menuItemId,
                        {
                            $inc: {
                                stock: change.quantity,
                            },
                        }
                    );
                }

                return res.status(400).json({
                    message: stockError.message,
                });
            }

            /*
            --------------------------------------------
            Generate order number
            --------------------------------------------
            */

            const orderNumber = `ORD-${Date.now()}-${Math.floor(
                Math.random() * 1000
            )}`;

            /*
            --------------------------------------------
            Create order
            --------------------------------------------
            */

            const order = await Order.create({
                orderNumber,
                userId: req.user.userId,
                items: processedItems,
                totalAmount,
                status: "Pending",
                paymentMethod,
                paymentStatus: "Pending",
                specialRequests,
            });

            return res.status(201).json({
                message: "Order placed successfully",
                order,
            });
        } catch (error) {
            console.error("Create order error:", error);

            return res.status(500).json({
                message: "Failed to place order",
            });
        }
    }
);


/*
==================================================
GET MY ORDERS
USER ONLY
GET /api/orders/my
==================================================
*/

router.get(
    "/my",
    authenticate,
    authorize("user"),
    async (req, res) => {
        try {
            const orders = await Order.find({
                userId: req.user.userId,
            })
                .sort({ createdAt: -1 })
                .populate("userId", "name mobile");

            return res.json({
                orders,
            });
        } catch (error) {
            console.error("Get my orders error:", error);

            return res.status(500).json({
                message: "Failed to fetch orders",
            });
        }
    }
);


/*
==================================================
GET ALL ORDERS
STAFF + ADMIN
GET /api/orders
==================================================
*/

router.get(
    "/",
    authenticate,
    authorize("staff", "admin"),
    async (req, res) => {
        try {
            const orders = await Order.find()
                .sort({ createdAt: -1 })
                .populate("userId", "name mobile");

            return res.json({
                orders,
            });
        } catch (error) {
            console.error("Get all orders error:", error);

            return res.status(500).json({
                message: "Failed to fetch orders",
            });
        }
    }
);


/*
==================================================
GET SINGLE ORDER
USER + STAFF + ADMIN
GET /api/orders/:id
==================================================
*/

router.get(
    "/:id",
    authenticate,
    authorize("user", "staff", "admin"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid order ID",
                });
            }

            const order = await Order.findById(req.params.id).populate(
                "userId",
                "name mobile"
            );

            if (!order) {
                return res.status(404).json({
                    message: "Order not found",
                });
            }

            /*
            User can only see their own order
            */

            if (
                req.user.role === "user" &&
                order.userId._id.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    message: "Access denied",
                });
            }

            return res.json({
                order,
            });
        } catch (error) {
            console.error("Get order error:", error);

            return res.status(500).json({
                message: "Failed to fetch order",
            });
        }
    }
);


/*
==================================================
UPDATE ORDER STATUS
STAFF + ADMIN
PATCH /api/orders/:id/status
==================================================
*/

router.patch(
    "/:id/status",
    authenticate,
    authorize("staff", "admin"),
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Accepted",
                "Preparing",
                "Ready",
                "Served",
                "Cancelled",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid order ID",
                });
            }

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    message: "Order not found",
                });
            }

            order.status = status;

            await order.save();

            return res.json({
                message: "Order status updated successfully",
                order,
            });
        } catch (error) {
            console.error("Update order status error:", error);

            return res.status(500).json({
                message: "Failed to update order status",
            });
        }
    }
);


/*
==================================================
UPDATE PAYMENT STATUS
ADMIN ONLY
PATCH /api/orders/:id/payment
==================================================
*/

router.patch(
    "/:id/payment",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const { paymentStatus } = req.body;

            const allowedPaymentStatuses = [
                "Pending",
                "Paid",
                "Failed",
                "Refunded",
            ];

            if (!allowedPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({
                    message: "Invalid payment status",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid order ID",
                });
            }

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    message: "Order not found",
                });
            }

            order.paymentStatus = paymentStatus;

            await order.save();

            return res.json({
                message: "Payment status updated successfully",
                order,
            });
        } catch (error) {
            console.error("Update payment error:", error);

            return res.status(500).json({
                message: "Failed to update payment status",
            });
        }
    }
);


module.exports = router;