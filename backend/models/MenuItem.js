const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
            enum: [
                "Breakfast",
                "Lunch",
                "Snacks",
                "Beverages",
                "Desserts",
                "Other",
            ],
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        // NEW
        // Words related to this food for smart search
        keywords: {
            type: [String],
            default: [],
            set: (keywords) =>
                Array.isArray(keywords)
                    ? keywords
                        .map((keyword) =>
                            String(keyword).trim().toLowerCase()
                        )
                        .filter(Boolean)
                    : [],
        },

        image: {
            type: String,
            default: "",
            trim: true,
        },

        available: {
            type: Boolean,
            default: true,
        },

        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "MenuItem",
    menuItemSchema
);