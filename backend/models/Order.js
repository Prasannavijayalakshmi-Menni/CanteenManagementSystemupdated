const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        image: {
            type: String,
            default: "",
        },
    },
    {
        _id: false,
    }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "Order must contain at least one item",
            },
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Preparing",
                "Ready",
                "Served",
                "Cancelled",
            ],
            default: "Pending",
            index: true,
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card"],
            default: "Cash",
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },

        specialRequests: {
            type: String,
            default: "",
            trim: true,
        },
    },

    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);