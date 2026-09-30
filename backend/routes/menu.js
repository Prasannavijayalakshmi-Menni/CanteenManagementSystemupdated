const express = require("express");
const MenuItem = require("../models/MenuItem");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET ALL MENU ITEMS
// Publicly accessible
// =====================================================

router.get("/", async (req, res) => {
    try {
        const menuItems = await MenuItem.find()
            .sort({ category: 1, name: 1 });

        res.status(200).json(menuItems);
    } catch (error) {
        console.error("Get menu error:", error);

        res.status(500).json({
            message: "Failed to fetch menu items",
        });
    }
});


// =====================================================
// GET SINGLE MENU ITEM
// Publicly accessible
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }

        res.status(200).json(menuItem);
    } catch (error) {
        console.error("Get menu item error:", error);

        res.status(500).json({
            message: "Failed to fetch menu item",
        });
    }
});


// =====================================================
// ADD NEW MENU ITEM
// ADMIN ONLY
// =====================================================

router.post(
    "/",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const {
                name,
                category,
                price,
                description,
                image,
                available,
                stock,
            } = req.body;

            // -----------------------------
            // Validation
            // -----------------------------

            if (!name || !category || price === undefined || !description) {
                return res.status(400).json({
                    message:
                        "Name, category, price and description are required",
                });
            }

            if (Number(price) < 0) {
                return res.status(400).json({
                    message: "Price cannot be negative",
                });
            }

            if (stock !== undefined && Number(stock) < 0) {
                return res.status(400).json({
                    message: "Stock cannot be negative",
                });
            }

            // -----------------------------
            // Create item
            // -----------------------------

            const menuItem = await MenuItem.create({
                name,
                category,
                price: Number(price),
                description,
                image: image || "",
                available:
                    available === undefined ? true : Boolean(available),
                stock:
                    stock === undefined ? 0 : Number(stock),
            });

            res.status(201).json({
                message: "Menu item added successfully",
                menuItem,
            });
        } catch (error) {
            console.error("Add menu item error:", error);

            res.status(500).json({
                message: "Failed to add menu item",
            });
        }
    }
);


// =====================================================
// UPDATE MENU ITEM
// ADMIN ONLY
// =====================================================

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const {
                name,
                category,
                price,
                description,
                image,
                available,
                stock,
            } = req.body;

            // -----------------------------
            // Validation
            // -----------------------------

            if (!name || !category || price === undefined || !description) {
                return res.status(400).json({
                    message:
                        "Name, category, price and description are required",
                });
            }

            if (Number(price) < 0) {
                return res.status(400).json({
                    message: "Price cannot be negative",
                });
            }

            if (stock !== undefined && Number(stock) < 0) {
                return res.status(400).json({
                    message: "Stock cannot be negative",
                });
            }

            // -----------------------------
            // Update
            // -----------------------------

            const menuItem = await MenuItem.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    category,
                    price: Number(price),
                    description,
                    image: image || "",
                    available:
                        available === undefined
                            ? true
                            : Boolean(available),
                    stock:
                        stock === undefined ? 0 : Number(stock),
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!menuItem) {
                return res.status(404).json({
                    message: "Menu item not found",
                });
            }

            res.status(200).json({
                message: "Menu item updated successfully",
                menuItem,
            });
        } catch (error) {
            console.error("Update menu item error:", error);

            res.status(500).json({
                message: "Failed to update menu item",
            });
        }
    }
);


// =====================================================
// DELETE MENU ITEM
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const menuItem = await MenuItem.findByIdAndDelete(
                req.params.id
            );

            if (!menuItem) {
                return res.status(404).json({
                    message: "Menu item not found",
                });
            }

            res.status(200).json({
                message: "Menu item deleted successfully",
            });
        } catch (error) {
            console.error("Delete menu item error:", error);

            res.status(500).json({
                message: "Failed to delete menu item",
            });
        }
    }
);


module.exports = router;