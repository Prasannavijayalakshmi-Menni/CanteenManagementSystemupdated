import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Rating,
} from "@mui/material";

import {
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  RateReview as RateReviewIcon,
  Star as StarIcon,
} from "@mui/icons-material";


// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
  "Desserts",
  "Other",
];


// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  name: "",
  category: "Breakfast",
  price: "",
  description: "",
  image: "",
  available: true,
  stock: 0,
};


// =====================================================
// ADMIN DASHBOARD
// =====================================================

const AdminDashboard = ({ user, onLogout }) => {

  // =====================================================
  // MENU STATE
  // =====================================================

  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState(emptyForm);


  // =====================================================
  // REVIEWS STATE
  // =====================================================

  const [foodReviews, setFoodReviews] = useState([]);

  const [reviewsLoading, setReviewsLoading] =
    useState(false);


  // =====================================================
  // FETCH MENU
  // =====================================================

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/api/menu");

      const items = Array.isArray(response.data)
        ? response.data
        : response.data.menu || [];

      setMenuItems(items);

    } catch (err) {
      console.error("Fetch menu error:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load menu items."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // FETCH CUSTOMER REVIEWS
  // =====================================================

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);

      const menuResponse =
        await axios.get("/api/menu");

      const items = Array.isArray(menuResponse.data)
        ? menuResponse.data
        : menuResponse.data.menu || [];

      const results = await Promise.all(
        items.map(async (food) => {
          try {
            const response =
              await axios.get(
                `/api/reviews/food/${food._id}`
              );

            const data = response.data || {};

            return {
              foodId: food._id,
              foodName: food.name,
              foodImage: food.image || "",
              averageRating: Number(
                data.averageRating || 0
              ),
              totalReviews: Number(
                data.totalReviews || 0
              ),
              reviews: Array.isArray(data.reviews)
                ? data.reviews
                : [],
            };

          } catch (err) {
            console.error(
              `Reviews error for ${food.name}:`,
              err
            );

            return {
              foodId: food._id,
              foodName: food.name,
              foodImage: food.image || "",
              averageRating: 0,
              totalReviews: 0,
              reviews: [],
            };
          }
        })
      );

      // Only show foods that have reviews
      const foodsWithReviews =
        results.filter(
          (food) => food.totalReviews > 0
        );

      setFoodReviews(foodsWithReviews);

    } catch (err) {
      console.error(
        "Fetch reviews error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load customer reviews."
      );

    } finally {
      setReviewsLoading(false);
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchMenu();
    fetchReviews();
  }, []);


  // =====================================================
  // OPEN ADD DIALOG
  // =====================================================

  const handleAddItem = () => {
    setEditingItem(null);

    setFormData({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setDialogOpen(true);
  };


  // =====================================================
  // OPEN EDIT DIALOG
  // =====================================================

  const handleEditItem = (item) => {
    setEditingItem(item);

    setFormData({
      name: item.name || "",

      category:
        item.category || "Other",

      price:
        item.price ?? "",

      description:
        item.description || "",

      image:
        item.image || "",

      available:
        item.available === undefined
          ? true
          : item.available,

      stock:
        item.stock ?? 0,
    });

    setError("");
    setSuccess("");

    setDialogOpen(true);
  };


  // =====================================================
  // CLOSE DIALOG
  // =====================================================

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);

    setEditingItem(null);

    setFormData({
      ...emptyForm,
    });
  };


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  // =====================================================
  // ADD / UPDATE MENU ITEM
  // =====================================================

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // -----------------------------
    // Validation
    // -----------------------------

    if (!formData.name.trim()) {
      setError(
        "Food name is required."
      );
      return;
    }

    if (!formData.category) {
      setError(
        "Please select a category."
      );
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (!formData.description.trim()) {
      setError(
        "Description is required."
      );
      return;
    }

    if (
      formData.stock === "" ||
      Number(formData.stock) < 0
    ) {
      setError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: formData.name.trim(),

        category:
          formData.category,

        price:
          Number(formData.price),

        description:
          formData.description.trim(),

        image:
          formData.image.trim(),

        available:
          formData.available,

        stock:
          Number(formData.stock),
      };


      // -----------------------------
      // EDIT
      // -----------------------------

      if (editingItem) {
        const response =
          await axios.put(
            `/api/menu/${editingItem._id}`,
            data
          );

        setSuccess(
          response.data.message ||
          "Food item updated successfully."
        );

      }

      // -----------------------------
      // ADD
      // -----------------------------

      else {
        const response =
          await axios.post(
            "/api/menu",
            data
          );

        setSuccess(
          response.data.message ||
          "Food item added successfully."
        );
      }


      // Refresh menu
      await fetchMenu();

      // Close dialog
      setDialogOpen(false);

      setEditingItem(null);

      setFormData({
        ...emptyForm,
      });

    } catch (err) {
      console.error(
        "Save menu item error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to save menu item."
      );

    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // DELETE MENU ITEM
  // =====================================================

  const handleDelete = async (item) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${item.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await axios.delete(
        `/api/menu/${item._id}`
      );

      setSuccess(
        `${item.name} deleted successfully.`
      );

      await fetchMenu();

    } catch (err) {
      console.error(
        "Delete menu item error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete menu item."
      );
    }
  };


  // =====================================================
  // QUICK AVAILABILITY CHANGE
  // =====================================================

  const handleAvailabilityChange = async (
    item,
    available
  ) => {
    try {
      setError("");
      setSuccess("");

      await axios.put(
        `/api/menu/${item._id}`,
        {
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          image: item.image || "",
          available,
          stock: item.stock,
        }
      );

      setSuccess(
        `${item.name} is now ${available
          ? "available"
          : "unavailable"
        }.`
      );

      await fetchMenu();

    } catch (err) {
      console.error(
        "Availability update error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to update availability."
      );
    }
  };


  // =====================================================
  // STATISTICS
  // =====================================================

  const totalItems =
    menuItems.length;

  const availableItems =
    menuItems.filter(
      (item) => item.available
    ).length;

  const unavailableItems =
    menuItems.filter(
      (item) => !item.available
    ).length;

  const lowStockItems =
    menuItems.filter(
      (item) =>
        Number(item.stock) > 0 &&
        Number(item.stock) <= 5
    ).length;

  const outOfStockItems =
    menuItems.filter(
      (item) =>
        Number(item.stock) === 0
    ).length;


  // =====================================================
  // UI
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",

        background:
          "linear-gradient(135deg, #F1F8E9 0%, #F8F9FA 100%)",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <AppBar
        position="static"
        sx={{
          background:
            "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",

          boxShadow:
            "0 4px 20px rgba(46, 125, 50, 0.3)",
        }}
      >
        <Toolbar>

          <RestaurantIcon
            sx={{
              mr: 2,
              fontSize: 34,
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
            }}
          >
            CanteenPro Admin
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >

            <Box
              sx={{
                textAlign: "right",

                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                }}
              >
                {user?.name || "Admin"}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  opacity: 0.85,
                }}
              >
                Restaurant Owner
              </Typography>
            </Box>

            <Button
              onClick={onLogout}
              variant="outlined"
              startIcon={<LogoutIcon />}
              sx={{
                color: "white",

                borderColor:
                  "rgba(255,255,255,0.7)",

                fontWeight: 700,

                "&:hover": {
                  borderColor: "white",

                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                },
              }}
            >
              Logout
            </Button>

          </Box>
        </Toolbar>
      </AppBar>


      {/* =================================================
          MAIN
      ================================================= */}

      <Container
        maxWidth="xl"
        sx={{
          py: 4,
        }}
      >

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <Box
          sx={{
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#2E7D32",
              mb: 1,
            }}
          >
            Admin Dashboard
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Manage your canteen menu, prices,
            availability, stock and customer feedback.
          </Typography>
        </Box>


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
            }}
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
            }}
            onClose={() =>
              setSuccess("")
            }
          >
            {success}
          </Alert>
        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        <Grid
          container
          spacing={2}
          sx={{
            mb: 4,
          }}
        >

          {/* TOTAL */}

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <DashboardIcon
                  sx={{
                    fontSize: 42,
                    color: "#2E7D32",
                  }}
                />

                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    {totalItems}
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Total Items
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>


          {/* AVAILABLE */}

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#2E7D32",
                }}
              >
                {availableItems}
              </Typography>

              <Typography
                color="text.secondary"
              >
                Available Items
              </Typography>
            </Paper>
          </Grid>


          {/* LOW STOCK */}

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#F57C00",
                }}
              >
                {lowStockItems}
              </Typography>

              <Typography
                color="text.secondary"
              >
                Low Stock
              </Typography>
            </Paper>
          </Grid>


          {/* OUT OF STOCK */}

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#D32F2F",
                }}
              >
                {outOfStockItems}
              </Typography>

              <Typography
                color="text.secondary"
              >
                Out of Stock
              </Typography>
            </Paper>
          </Grid>

        </Grid>


        {/* =================================================
            MENU MANAGEMENT HEADER
        ================================================= */}

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >

            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#2E7D32",
                }}
              >
                Menu Management
              </Typography>

              <Typography
                color="text.secondary"
              >
                Add, edit, remove and control
                food availability.
              </Typography>
            </Box>


            <Box
              sx={{
                display: "flex",
                gap: 1,
              }}
            >

              <IconButton
                onClick={fetchMenu}
                title="Refresh menu"
                sx={{
                  border:
                    "1px solid #ddd",
                }}
              >
                <RefreshIcon />
              </IconButton>


              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{
                  background:
                    "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",

                  fontWeight: 700,
                  px: 3,

                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                  },
                }}
              >
                Add Food
              </Button>

            </Box>
          </Box>
        </Paper>


        {/* =================================================
            MENU ITEMS
        ================================================= */}

        {loading ? (

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress
              sx={{
                color: "#2E7D32",
              }}
            />
          </Box>

        ) : menuItems.length === 0 ? (

          <Paper
            elevation={2}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
            }}
          >
            <RestaurantIcon
              sx={{
                fontSize: 70,
                color: "#BDBDBD",
                mb: 2,
              }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No food items yet
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mb: 3,
              }}
            >
              Add your first food item to start
              managing the menu.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{
                background: "#2E7D32",
              }}
            >
              Add First Food
            </Button>
          </Paper>

        ) : (

          <Grid
            container
            spacing={3}
          >
            {menuItems.map((item) => (

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={item._id}
              >

                <Card
                  elevation={3}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    overflow: "hidden",

                    opacity:
                      item.available
                        ? 1
                        : 0.65,

                    transition:
                      "transform 0.2s ease",

                    "&:hover": {
                      transform:
                        "translateY(-4px)",
                    },
                  }}
                >

                  {/* IMAGE */}

                  {item.image ? (

                    <CardMedia
                      component="img"
                      height="190"
                      image={item.image}
                      alt={item.name}
                      sx={{
                        objectFit: "cover",
                      }}
                    />

                  ) : (

                    <Box
                      sx={{
                        height: 190,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        background:
                          "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                      }}
                    >
                      <RestaurantIcon
                        sx={{
                          fontSize: 70,
                          color: "#4CAF50",
                        }}
                      />
                    </Box>

                  )}


                  <CardContent
                    sx={{
                      flexGrow: 1,
                    }}
                  >

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 1,
                        mb: 1,
                      }}
                    >

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                        }}
                      >
                        {item.name}
                      </Typography>

                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          backgroundColor:
                            "#E8F5E9",

                          color:
                            "#2E7D32",

                          fontWeight: 700,
                        }}
                      />

                    </Box>


                    <Typography
                      variant="h5"
                      sx={{
                        color: "#2E7D32",
                        fontWeight: 800,
                        mb: 1,
                      }}
                    >
                      ₹{item.price}
                    </Typography>


                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        minHeight: 48,
                        mb: 2,
                      }}
                    >
                      {item.description}
                    </Typography>


                    <Divider
                      sx={{
                        mb: 1.5,
                      }}
                    />


                    {/* STOCK */}

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >

                      <InventoryIcon
                        fontSize="small"
                        sx={{
                          color:
                            item.stock === 0
                              ? "#D32F2F"
                              : item.stock <= 5
                                ? "#F57C00"
                                : "#2E7D32",
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        Stock: {item.stock}
                      </Typography>

                    </Box>


                    {/* AVAILABILITY */}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            item.available
                          )}
                          onChange={(event) =>
                            handleAvailabilityChange(
                              item,
                              event.target.checked
                            )
                          }
                          color="success"
                        />
                      }
                      label={
                        item.available
                          ? "Available"
                          : "Unavailable"
                      }
                    />

                  </CardContent>


                  {/* ACTIONS */}

                  <CardActions
                    sx={{
                      p: 2,
                      pt: 0,
                    }}
                  >

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() =>
                        handleEditItem(item)
                      }
                      sx={{
                        color: "#2E7D32",
                        borderColor:
                          "#2E7D32",
                        fontWeight: 700,

                        "&:hover": {
                          borderColor:
                            "#1B5E20",

                          backgroundColor:
                            "#E8F5E9",
                        },
                      }}
                    >
                      Edit
                    </Button>


                    <IconButton
                      onClick={() =>
                        handleDelete(item)
                      }
                      sx={{
                        color: "#D32F2F",

                        "&:hover": {
                          backgroundColor:
                            "#FFEBEE",
                        },
                      }}
                      title="Delete food"
                    >
                      <DeleteIcon />
                    </IconButton>

                  </CardActions>

                </Card>

              </Grid>
            ))}
          </Grid>
        )}


        {/* =================================================
            CUSTOMER RATINGS & REVIEWS
        ================================================= */}

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mt: 5,
            mb: 3,
            borderRadius: 3,
          }}
        >

          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >

            <Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#2E7D32",

                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <RateReviewIcon />

                Customer Ratings & Reviews
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                See what customers think about
                each food item.
              </Typography>

            </Box>


            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReviews}
              disabled={reviewsLoading}
              sx={{
                color: "#2E7D32",
                borderColor: "#2E7D32",
                fontWeight: 700,

                "&:hover": {
                  borderColor: "#1B5E20",
                  backgroundColor:
                    "#E8F5E9",
                },
              }}
            >
              Refresh Reviews
            </Button>

          </Box>
        </Paper>


        {/* =================================================
            REVIEWS LOADING
        ================================================= */}

        {reviewsLoading ? (

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress
              sx={{
                color: "#2E7D32",
              }}
            />

            <Typography
              color="text.secondary"
              sx={{
                ml: 2,
                alignSelf: "center",
              }}
            >
              Loading customer reviews...
            </Typography>
          </Box>

        ) : foodReviews.length === 0 ? (

          <Paper
            elevation={2}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              mb: 4,
            }}
          >

            <StarIcon
              sx={{
                fontSize: 65,
                color: "#BDBDBD",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No customer reviews yet
            </Typography>

            <Typography
              color="text.secondary"
            >
              Ratings and reviews submitted by
              customers will appear here.
            </Typography>

          </Paper>

        ) : (

          <Grid
            container
            spacing={3}
            sx={{
              mb: 5,
            }}
          >

            {foodReviews.map((food) => (

              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={food.foodId}
              >

                <Card
                  elevation={3}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >

                  {/* FOOD IMAGE */}

                  {food.foodImage ? (

                    <CardMedia
                      component="img"
                      height="180"
                      image={food.foodImage}
                      alt={food.foodName}
                      sx={{
                        objectFit: "cover",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  ) : (

                    <Box
                      sx={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        background:
                          "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                      }}
                    >

                      <RestaurantIcon
                        sx={{
                          fontSize: 65,
                          color: "#4CAF50",
                        }}
                      />

                    </Box>

                  )}


                  <CardContent>

                    {/* FOOD NAME */}

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                      }}
                    >
                      {food.foodName}
                    </Typography>


                    {/* AVERAGE RATING */}

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >

                      <Rating
                        value={
                          food.averageRating
                        }
                        precision={0.1}
                        readOnly
                      />

                      <Typography
                        sx={{
                          fontWeight: 800,
                        }}
                      >
                        {food.averageRating.toFixed(
                          1
                        )}
                      </Typography>

                    </Box>


                    {/* TOTAL REVIEWS */}

                    <Typography
                      color="text.secondary"
                      sx={{
                        mb: 2,
                      }}
                    >
                      {food.totalReviews}{" "}
                      {food.totalReviews === 1
                        ? "review"
                        : "reviews"}
                    </Typography>


                    <Divider
                      sx={{
                        mb: 2,
                      }}
                    />


                    {/* INDIVIDUAL REVIEWS */}

                    {food.reviews.map(
                      (review, index) => (

                        <Box
                          key={
                            review._id ||
                            `${food.foodId}-${index}`
                          }
                          sx={{
                            p: 2,
                            mb: 1.5,
                            borderRadius: 2,

                            backgroundColor:
                              "#F5F7F5",
                          }}
                        >

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              gap: 1,
                            }}
                          >

                            <Typography
                              sx={{
                                fontWeight: 700,
                              }}
                            >
                              {review.userId?.name ||
                                review.user?.name ||
                                review.userName ||
                                "Customer"}
                            </Typography>

                            <Rating
                              value={Number(
                                review.rating || 0
                              )}
                              size="small"
                              readOnly
                            />

                          </Box>


                          {/* COMMENT */}

                          {review.comment && (
                            <Typography
                              color="text.secondary"
                              sx={{
                                mt: 1,
                                lineHeight: 1.6,
                              }}
                            >
                              "{review.comment}"
                            </Typography>
                          )}


                          {/* DATE */}

                          {review.createdAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display:
                                  "block",
                                mt: 1,
                              }}
                            >
                              {new Date(
                                review.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </Typography>
                          )}

                        </Box>

                      )
                    )}

                  </CardContent>

                </Card>

              </Grid>

            ))}

          </Grid>
        )}

      </Container>


      {/* =================================================
          ADD / EDIT FOOD DIALOG
      ================================================= */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#2E7D32",
          }}
        >
          {editingItem
            ? "Edit Food Item"
            : "Add New Food"}
        </DialogTitle>


        <DialogContent>

          <Box
            sx={{
              pt: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >

            {/* NAME */}

            <TextField
              label="Food Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              placeholder="Example: Chicken Biryani"
            />


            {/* CATEGORY */}

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
              required
            >
              {categories.map(
                (category) => (
                  <MenuItem
                    key={category}
                    value={category}
                  >
                    {category}
                  </MenuItem>
                )
              )}
            </TextField>


            {/* PRICE */}

            <TextField
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{
                min: 0,
              }}
              InputProps={{
                startAdornment: (
                  <Typography
                    sx={{
                      mr: 1,
                      fontWeight: 700,
                    }}
                  >
                    ₹
                  </Typography>
                ),
              }}
            />


            {/* STOCK */}

            <TextField
              label="Stock Quantity"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{
                min: 0,
              }}
            />


            {/* DESCRIPTION */}

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              required
              multiline
              rows={3}
              placeholder="Describe the food item..."
            />


            {/* IMAGE */}

            <TextField
              label="Image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              fullWidth
              placeholder="https://example.com/food.jpg"
              helperText="You can add an image URL for now."
            />


            {/* AVAILABLE */}

            <FormControlLabel
              control={
                <Switch
                  name="available"
                  checked={
                    formData.available
                  }
                  onChange={handleChange}
                  color="success"
                />
              }
              label={
                formData.available
                  ? "Food is Available"
                  : "Food is Unavailable"
              }
            />

          </Box>

        </DialogContent>


        <DialogActions
          sx={{
            p: 3,
          }}
        >

          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            variant="outlined"
          >
            Cancel
          </Button>


          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="contained"

            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : editingItem ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }

            sx={{
              background:
                "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",

              fontWeight: 700,

              "&:hover": {
                background:
                  "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
              },
            }}
          >
            {saving
              ? "Saving..."
              : editingItem
                ? "Update Food"
                : "Add Food"}
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default AdminDashboard;