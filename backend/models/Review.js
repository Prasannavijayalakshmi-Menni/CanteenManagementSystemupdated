const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
            index: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

/*
  A user can review a particular food
  only once for a particular order.

  Example:

  User A
  Order 123
  Samosa

  → only ONE review allowed.
*/
reviewSchema.index(
    {
        userId: 1,
        orderId: 1,
        menuItemId: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "Review",
    reviewSchema
);
