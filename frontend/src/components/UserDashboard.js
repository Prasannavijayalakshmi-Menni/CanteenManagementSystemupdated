import React, { useEffect, useMemo, useState } from "react";
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
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Restaurant,
  ShoppingCart,
  ReceiptLong,
  RateReview,
  Person,
  Logout,
  Search,
  Add,
  Remove,
  Home,
} from "@mui/icons-material";


// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  "All",
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
  "Dessert",
];


// =====================================================
// USER DASHBOARD
// =====================================================

const UserDashboard = ({ user, onLogout }) => {

  // =====================================================
  // BASIC STATE
  // =====================================================

  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // =====================================================
  // CART
  // =====================================================

  const [cart, setCart] = useState([]);
  const [specialRequests, setSpecialRequests] = useState("");

  // =====================================================
  // ORDERS
  // =====================================================

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // =====================================================
  // REVIEWS
  // =====================================================

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [selectedFood, setSelectedFood] =
    useState(null);

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [reviewComment, setReviewComment] =
    useState("");

  const [submittingReview, setSubmittingReview] =
    useState(false);

  // =====================================================
  // FOOD RATINGS
  // =====================================================

  const [foodRatings, setFoodRatings] =
    useState({});

  const [foodReviewsDialogOpen, setFoodReviewsDialogOpen] =
    useState(false);

  const [selectedFoodForReviews, setSelectedFoodForReviews] =
    useState(null);

  const [selectedFoodReviews, setSelectedFoodReviews] =
    useState([]);

  const [selectedFoodAverageRating, setSelectedFoodAverageRating] =
    useState(0);

  const [selectedFoodTotalReviews, setSelectedFoodTotalReviews] =
    useState(0);

  const [loadingFoodReviews, setLoadingFoodReviews] =
    useState(false);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [orderMessage, setOrderMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD MENU
  // =====================================================

  const loadMenu = async () => {
    try {
      setLoadingMenu(true);

      const response = await axios.get("/api/menu");

      const items = Array.isArray(response.data)
        ? response.data
        : response.data.menuItems || [];

      setMenuItems(items);

      // Load ratings for every food item
      const ratingResults = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await axios.get(
              `/api/reviews/food/${item._id}`
            );

            return {
              menuItemId: item._id,
              averageRating:
                response.data?.averageRating || 0,
              totalReviews:
                response.data?.totalReviews || 0,
            };
          } catch (err) {
            console.error(
              `Rating load failed for ${item.name}:`,
              err
            );

            return {
              menuItemId: item._id,
              averageRating: 0,
              totalReviews: 0,
            };
          }
        })
      );

      const ratingMap = {};

      ratingResults.forEach((item) => {
        ratingMap[item.menuItemId] = {
          averageRating: item.averageRating,
          totalReviews: item.totalReviews,
        };
      });

      setFoodRatings(ratingMap);

    } catch (err) {
      console.error("Error loading menu:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load menu."
      );

    } finally {
      setLoadingMenu(false);
    }
  };


  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Your login session has expired. Please login again."
        );
        return;
      }

      const response = await axios.get(
        "/api/orders/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiOrders = Array.isArray(response.data)
        ? response.data
        : response.data.orders || [];

      const myOrders = apiOrders.map((order) => {
        const totalQuantity =
          (order.items || []).reduce(
            (total, item) =>
              total + Number(item.quantity || 0),
            0
          );

        return {
          ...order,

          itemName:
            (order.items || [])
              .map(
                (item) =>
                  `${item.name} × ${item.quantity}`
              )
              .join(", "),

          quantity: totalQuantity,

          price:
            totalQuantity > 0
              ? order.totalAmount / totalQuantity
              : 0,
        };
      });

      setOrders(myOrders);

    } catch (err) {
      console.error(
        "Error loading orders:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load your orders."
      );

    } finally {
      setLoadingOrders(false);
    }
  };


  // =====================================================
  // LOAD MY REVIEWS
  // =====================================================

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);

      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await axios.get(
        "/api/reviews/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews(
        response.data?.reviews || []
      );

    } catch (err) {
      console.error(
        "Error loading reviews:",
        err
      );

    } finally {
      setLoadingReviews(false);
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadMenu();
    loadOrders();
    loadReviews();
  }, []);


  // =====================================================
  // SEARCH + CATEGORY FILTER
  // =====================================================

  const filteredMenu = useMemo(() => {

    const text =
      search.trim().toLowerCase();

    return menuItems.filter((item) => {

      const name =
        (item.name || "").toLowerCase();

      const itemCategory =
        (item.category || "").toLowerCase();

      const description =
        (item.description || "").toLowerCase();

      const matchesSearch =
        !text ||
        name.includes(text) ||
        itemCategory.includes(text) ||
        description.includes(text);

      const matchesCategory =
        category === "All" ||
        item.category === category ||
        (
          category === "Dessert" &&
          item.category === "Desserts"
        );

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  }, [menuItems, search, category]);


  // =====================================================
  // CART FUNCTIONS
  // =====================================================

  const addToCart = (item) => {

    if (
      !item.available ||
      Number(item.stock) <= 0
    ) {
      setError(
        `${item.name} is currently unavailable.`
      );
      return;
    }

    setCart((previousCart) => {

      const existing =
        previousCart.find(
          (cartItem) =>
            cartItem._id === item._id
        );

      if (existing) {

        if (
          existing.quantity >=
          Number(item.stock)
        ) {
          return previousCart;
        }

        return previousCart.map(
          (cartItem) =>
            cartItem._id === item._id
              ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
              }
              : cartItem
        );
      }

      return [
        ...previousCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });

    setError("");
  };


  const increaseQuantity = (id) => {

    setCart((previousCart) =>
      previousCart.map((item) => {

        if (item._id !== id) {
          return item;
        }

        if (
          item.quantity >=
          Number(item.stock)
        ) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  };


  const decreaseQuantity = (id) => {

    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item._id === id
            ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };


  const removeFromCart = (id) => {

    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          item._id !== id
      )
    );
  };


  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );


  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      item.quantity,
    0
  );


  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder = async () => {

    if (cart.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    try {

      setError("");
      setOrderMessage("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your login session has expired. Please login again."
        );
        return;
      }

      const response =
        await axios.post(
          "/api/orders",
          {
            items: cart.map((item) => ({
              menuItemId:
                item._id,
              quantity:
                item.quantity,
            })),

            paymentMethod:
              "Cash",

            specialRequests:
              specialRequests.trim(),
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      setCart([]);

      setSpecialRequests("");

      const tokenNumber =
        response.data?.order
          ?.orderNumber ||
        response.data
          ?.orderNumber ||
        "Generated";

      setOrderMessage(
        `Order placed successfully! Your Token: ${tokenNumber}`
      );

      await loadOrders();

      setActivePage("orders");

    } catch (err) {

      console.error(
        "Place order error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to place order."
      );
    }
  };


  // =====================================================
  // OPEN FOOD REVIEWS
  // =====================================================

  const openFoodReviews = async (food) => {

    try {

      setLoadingFoodReviews(true);
      setError("");

      setSelectedFoodForReviews(food);
      setSelectedFoodReviews([]);
      setSelectedFoodAverageRating(0);
      setSelectedFoodTotalReviews(0);

      setFoodReviewsDialogOpen(true);

      const response =
        await axios.get(
          `/api/reviews/food/${food._id}`
        );

      setSelectedFoodReviews(
        response.data?.reviews || []
      );

      setSelectedFoodAverageRating(
        response.data?.averageRating || 0
      );

      setSelectedFoodTotalReviews(
        response.data?.totalReviews || 0
      );

      setFoodRatings((previous) => ({
        ...previous,

        [food._id]: {
          averageRating:
            response.data
              ?.averageRating || 0,

          totalReviews:
            response.data
              ?.totalReviews || 0,
        },
      }));

    } catch (err) {

      console.error(
        "Error loading food reviews:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load food reviews."
      );

    } finally {
      setLoadingFoodReviews(false);
    }
  };


  const closeFoodReviews = () => {

    setFoodReviewsDialogOpen(false);

    setSelectedFoodForReviews(null);

    setSelectedFoodReviews([]);

    setSelectedFoodAverageRating(0);

    setSelectedFoodTotalReviews(0);
  };


  // =====================================================
  // CHECK WHETHER FOOD IS ALREADY REVIEWED
  // =====================================================

  const isFoodReviewed = (
    orderId,
    menuItemId
  ) => {

    return reviews.some((review) => {

      const reviewOrderId =
        review.orderId?._id ||
        review.orderId;

      const reviewMenuItemId =
        review.menuItemId?._id ||
        review.menuItemId;

      return (
        String(reviewOrderId) ===
        String(orderId) &&
        String(reviewMenuItemId) ===
        String(menuItemId)
      );
    });
  };


  // =====================================================
  // OPEN REVIEW DIALOG
  // =====================================================

  const openReviewDialog = (
    order,
    food
  ) => {

    setSelectedOrder(order);

    setSelectedFood(food);

    setSelectedRating(0);

    setReviewComment("");

    setError("");

    setReviewDialogOpen(true);
  };


  const closeReviewDialog = () => {

    if (submittingReview) {
      return;
    }

    setReviewDialogOpen(false);

    setSelectedOrder(null);

    setSelectedFood(null);

    setSelectedRating(0);

    setReviewComment("");
  };


  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const submitReview = async () => {

    if (
      !selectedOrder ||
      !selectedFood
    ) {
      setError(
        "Please select a food item."
      );
      return;
    }

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setError(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    try {

      setSubmittingReview(true);

      setError("");

      setOrderMessage("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your login session has expired. Please login again."
        );
        return;
      }

      await axios.post(
        "/api/reviews",
        {
          orderId:
            selectedOrder._id,

          menuItemId:
            selectedFood.menuItemId,

          rating:
            selectedRating,

          comment:
            reviewComment.trim(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const reviewedFoodId =
        selectedFood.menuItemId;

      setReviewDialogOpen(false);

      setSelectedOrder(null);

      setSelectedFood(null);

      setSelectedRating(0);

      setReviewComment("");

      setOrderMessage(
        "Review submitted successfully!"
      );

      await loadReviews();

      // Refresh food rating
      try {

        const response =
          await axios.get(
            `/api/reviews/food/${reviewedFoodId}`
          );

        setFoodRatings((previous) => ({
          ...previous,

          [reviewedFoodId]: {
            averageRating:
              response.data
                ?.averageRating || 0,

            totalReviews:
              response.data
                ?.totalReviews || 0,
          },
        }));

      } catch (err) {

        console.error(
          "Unable to refresh food rating:",
          err
        );
      }

    } catch (err) {

      console.error(
        "Submit review error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to submit review."
      );

    } finally {
      setSubmittingReview(false);
    }
  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = (page) => {

    setActivePage(page);

    setDrawerOpen(false);

    setOrderMessage("");

    setError("");
  };
  // =====================================================
  // HOME
  // =====================================================

  const renderHome = () => (
    <Box
      sx={{
        minHeight: "calc(100vh - 150px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 900,
          borderRadius: 5,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #2E7D32 0%, #43A047 50%, #66BB6A 100%)",
          color: "white",
          boxShadow:
            "0 12px 35px rgba(46, 125, 50, 0.25)",
        }}
      >
        <CardContent
          sx={{
            textAlign: "center",
            px: {
              xs: 3,
              sm: 5,
              md: 8,
            },
            py: {
              xs: 5,
              sm: 6,
              md: 7,
            },
          }}
        >
          {/* FOOD ICON */}

          <Restaurant
            sx={{
              fontSize: 60,
              mb: 2,
            }}
          />

          {/* WELCOME */}

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: {
                xs: "2rem",
                sm: "2.5rem",
                md: "3rem",
              },
            }}
          >
            Welcome, {user.name}!
          </Typography>

          {/* SHORT MESSAGE */}

          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              opacity: 0.95,
              mb: 1,
            }}
          >
            Your favorite food is just a click away.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              mb: 3.5,
            }}
          >
            Explore our menu and enjoy a delicious meal.
          </Typography>

          {/* QUOTE */}

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontStyle: "italic",
              mb: 1.5,
            }}
          >
            "Order Fresh. Eat Happy."
          </Typography>

          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
              mb: 4,
            }}
          >
            Fresh food • Easy ordering • Happy moments
          </Typography>

          {/* VIEW MENU */}

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("menu")}
            sx={{
              px: 5,
              py: 1.4,
              borderRadius: 3,
              fontWeight: 800,
              backgroundColor: "white",
              color: "#2E7D32",
              boxShadow:
                "0 5px 15px rgba(0,0,0,0.15)",
              "&:hover": {
                backgroundColor: "#F1F8E9",
              },
            }}
          >
            VIEW MENU
          </Button>

          {/* BOTTOM MESSAGE */}

          <Typography
            variant="body2"
            sx={{
              mt: 4,
              opacity: 0.9,
            }}
          >
            Discover your next favorite meal today.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );



  // =====================================================
  // MENU
  // =====================================================

  const renderMenu = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        Food Menu
      </Typography>


      <TextField
        fullWidth
        placeholder="Search food..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        sx={{
          mb: 2,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />


      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        {categories.map((item) => (

          <Chip
            key={item}
            label={item}
            clickable
            color={
              category === item
                ? "success"
                : "default"
            }
            onClick={() =>
              setCategory(item)
            }
          />

        ))}
      </Box>


      {loadingMenu ? (

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 5,
          }}
        >
          <CircularProgress />
        </Box>

      ) : filteredMenu.length === 0 ? (

        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            No food items found
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
            }}
          >
            Try another search or category.
          </Typography>
        </Card>

      ) : (

        <Grid
          container
          spacing={3}
        >

          {filteredMenu.map((item) => {

            const rating =
              foodRatings[item._id];

            return (

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={item._id}
              >

                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >

                  {item.image ? (

                    <CardMedia
                      component="img"
                      height="200"
                      image={item.image}
                      alt={item.name}
                    />

                  ) : (

                    <Box
                      sx={{
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          "#E8F5E9",
                      }}
                    >
                      <Restaurant
                        sx={{
                          fontSize: 70,
                          color: "#2E7D32",
                        }}
                      />
                    </Box>

                  )}


                  <CardContent
                    sx={{
                      flexGrow: 1,
                    }}
                  >

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {item.name}
                    </Typography>


                    <Chip
                      size="small"
                      label={item.category}
                      sx={{
                        mt: 1,
                        mb: 1,
                      }}
                    />


                    <Typography
                      color="text.secondary"
                      sx={{
                        mb: 2,
                      }}
                    >
                      {item.description}
                    </Typography>


                    {/* RATING */}

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >

                      {rating?.totalReviews > 0 ? (

                        <>
                          <Rating
                            value={
                              rating.averageRating
                            }
                            precision={0.1}
                            readOnly
                            size="small"
                          />

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {Number(
                              rating.averageRating
                            ).toFixed(1)}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            ({rating.totalReviews})
                          </Typography>
                        </>

                      ) : (

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          No reviews yet
                        </Typography>

                      )}

                    </Box>


                    <Typography
                      variant="h6"
                      sx={{
                        color: "#2E7D32",
                        fontWeight: 800,
                        mb: 2,
                      }}
                    >
                      ₹{item.price}
                    </Typography>


                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color:
                          Number(item.stock) <= 5
                            ? "#D32F2F"
                            : "#2E7D32",
                      }}
                    >
                      {Number(item.stock) > 0
                        ? `Stock: ${item.stock}`
                        : "Out of stock"}
                    </Typography>


                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      disabled={
                        !item.available ||
                        Number(item.stock) <= 0
                      }
                      onClick={() =>
                        addToCart(item)
                      }
                      sx={{
                        mb: 1,
                        background:
                          "linear-gradient(135deg, #2E7D32, #4CAF50)",
                      }}
                    >
                      {item.available &&
                        Number(item.stock) > 0
                        ? "Add to Cart"
                        : "Unavailable"}
                    </Button>


                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RateReview />}
                      onClick={() =>
                        openFoodReviews(item)
                      }
                      sx={{
                        color: "#2E7D32",
                        borderColor:
                          "#2E7D32",
                      }}
                    >
                      Reviews
                    </Button>

                  </CardContent>

                </Card>

              </Grid>

            );
          })}

        </Grid>

      )}

    </>
  );


  // =====================================================
  // CART
  // =====================================================

  const renderCart = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        Your Cart
      </Typography>


      {cart.length === 0 ? (

        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <ShoppingCart
            sx={{
              fontSize: 70,
              color: "#BDBDBD",
            }}
          />

          <Typography
            variant="h6"
            sx={{
              mt: 2,
              fontWeight: 700,
            }}
          >
            Your cart is empty
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate("menu")
            }
            sx={{
              mt: 3,
              backgroundColor:
                "#2E7D32",
            }}
          >
            Browse Menu
          </Button>
        </Card>

      ) : (

        <Grid
          container
          spacing={3}
        >

          <Grid
            item
            xs={12}
            md={8}
          >

            {cart.map((item) => (

              <Card
                key={item._id}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                }}
              >

                <CardContent>

                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                  >

                    <Grid
                      item
                      xs={3}
                      sm={2}
                    >

                      {item.image ? (

                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: "100%",
                            height: 80,
                            objectFit:
                              "cover",
                            borderRadius: 2,
                          }}
                        />

                      ) : (

                        <Box
                          sx={{
                            width: "100%",
                            height: 80,
                            borderRadius: 2,
                            backgroundColor:
                              "#E8F5E9",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                          }}
                        >
                          <Restaurant
                            sx={{
                              color:
                                "#2E7D32",
                            }}
                          />
                        </Box>

                      )}

                    </Grid>


                    <Grid
                      item
                      xs={9}
                      sm={4}
                    >

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {item.name}
                      </Typography>

                      <Typography
                        color="text.secondary"
                      >
                        ₹{item.price}
                      </Typography>

                    </Grid>


                    <Grid
                      item
                      xs={6}
                      sm={3}
                    >

                      <Box
                        sx={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 1,
                        }}
                      >

                        <IconButton
                          size="small"
                          onClick={() =>
                            decreaseQuantity(
                              item._id
                            )
                          }
                        >
                          <Remove />
                        </IconButton>

                        <Typography
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          {item.quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() =>
                            increaseQuantity(
                              item._id
                            )
                          }
                        >
                          <Add />
                        </IconButton>

                      </Box>

                    </Grid>


                    <Grid
                      item
                      xs={6}
                      sm={3}
                    >

                      <Typography
                        sx={{
                          fontWeight: 800,
                          color:
                            "#2E7D32",
                        }}
                      >
                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}
                      </Typography>

                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          removeFromCart(
                            item._id
                          )
                        }
                      >
                        Remove
                      </Button>

                    </Grid>

                  </Grid>

                </CardContent>

              </Card>

            ))}

          </Grid>


          {/* ORDER SUMMARY */}

          <Grid
            item
            xs={12}
            md={4}
          >

            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                position: "sticky",
                top: 90,
              }}
            >

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                }}
              >
                Order Summary
              </Typography>


              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  mb: 2,
                }}
              >
                <Typography>
                  Items
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {cartCount}
                </Typography>
              </Box>


              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  mb: 2,
                }}
              >
                <Typography>
                  Total
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color:
                      "#2E7D32",
                  }}
                >
                  ₹{cartTotal.toFixed(2)}
                </Typography>
              </Box>


              <Divider
                sx={{
                  mb: 2,
                }}
              />


              {/* SPECIAL REQUIREMENTS */}

              <Typography
                sx={{
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Special Requirements
                <Typography
                  component="span"
                  color="text.secondary"
                  sx={{
                    ml: 1,
                    fontSize:
                      "0.8rem",
                    fontWeight: 400,
                  }}
                >
                  (Optional)
                </Typography>
              </Typography>


              <TextField
                fullWidth
                multiline
                minRows={3}
                value={specialRequests}
                onChange={(e) =>
                  setSpecialRequests(
                    e.target.value
                  )
                }
                placeholder="Example: More spicy, less spicy, less oil, no onion, extra chutney..."
                sx={{
                  mb: 2,
                }}
              />


              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={placeOrder}
                sx={{
                  background:
                    "linear-gradient(135deg, #2E7D32, #4CAF50)",
                  fontWeight: 700,
                }}
              >
                PLACE ORDER
              </Button>

            </Card>

          </Grid>

        </Grid>

      )}

    </>
  );


  // =====================================================
  // ORDERS
  // =====================================================

  const renderOrders = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        My Orders
      </Typography>


      {loadingOrders ? (

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>

      ) : orders.length === 0 ? (

        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >

          <ReceiptLong
            sx={{
              fontSize: 65,
              color: "#BDBDBD",
            }}
          />

          <Typography
            variant="h6"
            sx={{
              mt: 2,
              fontWeight: 700,
            }}
          >
            No orders yet
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate("menu")
            }
            sx={{
              mt: 3,
              backgroundColor:
                "#2E7D32",
            }}
          >
            Order Food
          </Button>

        </Card>

      ) : (

        <Grid
          container
          spacing={3}
        >

          {orders.map((order) => (

            <Grid
              item
              xs={12}
              key={order._id}
            >

              <Card
                sx={{
                  borderRadius: 3,
                }}
              >

                <CardContent>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      flexWrap:
                        "wrap",
                      gap: 2,
                    }}
                  >

                    <Box>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                        }}
                      >
                        Token:{" "}
                        {order.orderNumber}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {order.itemName}
                      </Typography>

                    </Box>


                    <Chip
                      label={
                        order.status
                      }
                      color={
                        order.status ===
                          "Served"
                          ? "success"
                          : order.status ===
                            "Cancelled"
                            ? "error"
                            : "warning"
                      }
                      sx={{
                        fontWeight: 700,
                      }}
                    />

                  </Box>


                  <Divider
                    sx={{
                      my: 2,
                    }}
                  />


                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      flexWrap:
                        "wrap",
                      gap: 2,
                    }}
                  >

                    <Typography>
                      Total:{" "}
                      <strong>
                        ₹
                        {Number(
                          order.totalAmount ||
                          0
                        ).toFixed(2)}
                      </strong>
                    </Typography>

                    <Typography>
                      Payment:{" "}
                      {order.paymentMethod ||
                        "Cash"}
                    </Typography>

                  </Box>


                  {/* SPECIAL REQUIREMENTS */}

                  {order.specialRequests && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor:
                          "#FFF8E1",
                        border:
                          "1px solid #FFE082",
                      }}
                    >

                      <Typography
                        sx={{
                          fontWeight: 700,
                          color:
                            "#8D6E00",
                        }}
                      >
                        Special Requirements
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {order.specialRequests}
                      </Typography>

                    </Box>
                  )}


                  {/* SERVED ITEMS */}

                  {order.status ===
                    "Served" && (

                      <Box
                        sx={{
                          mt: 3,
                        }}
                      >

                        <Typography
                          sx={{
                            fontWeight: 800,
                            mb: 1.5,
                            color:
                              "#2E7D32",
                          }}
                        >
                          Rate & Review
                        </Typography>


                        {(order.items || [])
                          .map(
                            (food) => (
                              <Box
                                key={
                                  food.menuItemId
                                }
                                sx={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  mb: 1,
                                  gap: 2,
                                }}
                              >

                                <Typography>
                                  {food.name}
                                </Typography>


                                {isFoodReviewed(
                                  order._id,
                                  food.menuItemId
                                ) ? (

                                  <Chip
                                    label="Reviewed"
                                    color="success"
                                    size="small"
                                  />

                                ) : (

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={
                                      <RateReview />
                                    }
                                    onClick={() =>
                                      openReviewDialog(
                                        order,
                                        food
                                      )
                                    }
                                    sx={{
                                      color:
                                        "#2E7D32",
                                      borderColor:
                                        "#2E7D32",
                                    }}
                                  >
                                    Rate & Review
                                  </Button>

                                )}

                              </Box>
                            )
                          )}

                      </Box>

                    )}

                </CardContent>

              </Card>

            </Grid>

          ))}

        </Grid>

      )}

    </>
  );


  // =====================================================
  // REVIEWS
  // =====================================================

  const renderReviews = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        My Reviews
      </Typography>


      {loadingReviews ? (

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>

      ) : reviews.length === 0 ? (

        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >

          <RateReview
            sx={{
              fontSize: 65,
              color: "#2E7D32",
            }}
          />

          <Typography
            variant="h6"
            sx={{
              mt: 2,
              fontWeight: 700,
            }}
          >
            You haven't submitted any reviews yet.
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
            }}
          >
            After your order is served,
            you can rate and review each food item.
          </Typography>

        </Card>

      ) : (

        <Grid
          container
          spacing={3}
        >

          {reviews.map((review) => (

            <Grid
              item
              xs={12}
              md={6}
              key={review._id}
            >

              <Card
                sx={{
                  borderRadius: 3,
                }}
              >

                <CardContent>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    {review.menuItemId?.name ||
                      review.foodName ||
                      "Food Item"}
                  </Typography>


                  <Rating
                    value={Number(
                      review.rating || 0
                    )}
                    readOnly
                    sx={{
                      mt: 1,
                    }}
                  />


                  {review.comment && (
                    <Typography
                      color="text.secondary"
                      sx={{
                        mt: 1.5,
                      }}
                    >
                      "{review.comment}"
                    </Typography>
                  )}


                  {review.createdAt && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mt: 1.5,
                      }}
                    >
                      {new Date(
                        review.createdAt
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </Typography>
                  )}

                </CardContent>

              </Card>

            </Grid>

          ))}

        </Grid>

      )}

    </>
  );


  // =====================================================
  // PROFILE
  // =====================================================

  const renderProfile = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        My Profile
      </Typography>


      <Card
        sx={{
          p: 4,
          borderRadius: 3,
        }}
      >

        <Person
          sx={{
            fontSize: 60,
            color: "#2E7D32",
          }}
        />


        <Typography
          variant="h5"
          sx={{
            mt: 2,
            fontWeight: 700,
          }}
        >
          {user.name}
        </Typography>


        <Typography
          sx={{
            mt: 1,
          }}
        >
          Mobile: {user.mobile}
        </Typography>


        <Typography
          sx={{
            mt: 1,
          }}
        >
          Account Type: User
        </Typography>

      </Card>
    </>
  );


  // =====================================================
  // PAGE ROUTER
  // =====================================================

  const renderPage = () => {

    if (activePage === "home") {
      return renderHome();
    }

    if (activePage === "menu") {
      return renderMenu();
    }

    if (activePage === "cart") {
      return renderCart();
    }

    if (activePage === "orders") {
      return renderOrders();
    }

    if (activePage === "reviews") {
      return renderReviews();
    }

    if (activePage === "profile") {
      return renderProfile();
    }

    return renderHome();
  };


  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7f5",
      }}
    >

      {/* =================================================
          APP BAR
      ================================================= */}

      <AppBar
        position="sticky"
        sx={{
          background:
            "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
        }}
      >

        <Toolbar>

          <IconButton
            color="inherit"
            onClick={() =>
              setDrawerOpen(true)
            }
          >
            <MenuIcon />
          </IconButton>


          <Restaurant
            sx={{
              mx: 1,
            }}
          />


          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
            }}
          >
            CanteenPro
          </Typography>


          <Typography
            sx={{
              mr: 2,
              display: {
                xs: "none",
                sm: "block",
              },
            }}
          >
            Hi, {user.name}
          </Typography>


          <IconButton
            color="inherit"
            onClick={() =>
              navigate("cart")
            }
          >

            <Badge
              badgeContent={cartCount}
              color="error"
            >
              <ShoppingCart />
            </Badge>

          </IconButton>

        </Toolbar>

      </AppBar>


      {/* =================================================
          DRAWER
      ================================================= */}

      <Drawer
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
      >

        <Box
          sx={{
            width: 280,
          }}
        >

          <Box
            sx={{
              p: 3,

              background:
                "linear-gradient(135deg, #2E7D32, #4CAF50)",

              color: "white",
            }}
          >

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
              }}
            >
              CanteenPro
            </Typography>

            <Typography>
              User Panel
            </Typography>

          </Box>


          <List>

            <ListItemButton
              onClick={() =>
                navigate("home")
              }
            >
              <ListItemIcon>
                <Home />
              </ListItemIcon>

              <ListItemText
                primary="Home"
              />
            </ListItemButton>


            <ListItemButton
              onClick={() =>
                navigate("menu")
              }
            >
              <ListItemIcon>
                <Restaurant />
              </ListItemIcon>

              <ListItemText
                primary="Menu"
              />
            </ListItemButton>


            <ListItemButton
              onClick={() =>
                navigate("cart")
              }
            >
              <ListItemIcon>
                <ShoppingCart />
              </ListItemIcon>

              <ListItemText
                primary="Cart"
              />
            </ListItemButton>


            <ListItemButton
              onClick={() =>
                navigate("orders")
              }
            >
              <ListItemIcon>
                <ReceiptLong />
              </ListItemIcon>

              <ListItemText
                primary="My Orders"
              />
            </ListItemButton>


            <ListItemButton
              onClick={() =>
                navigate("reviews")
              }
            >
              <ListItemIcon>
                <RateReview />
              </ListItemIcon>

              <ListItemText
                primary="Reviews"
              />
            </ListItemButton>


            <ListItemButton
              onClick={() =>
                navigate("profile")
              }
            >
              <ListItemIcon>
                <Person />
              </ListItemIcon>

              <ListItemText
                primary="Profile"
              />
            </ListItemButton>


            <Divider />


            <ListItemButton
              onClick={onLogout}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>

              <ListItemText
                primary="Logout"
              />
            </ListItemButton>

          </List>

        </Box>

      </Drawer>


      {/* =================================================
          CONTENT
      ================================================= */}

      <Container
        maxWidth="xl"
        sx={{
          py: 4,
        }}
      >

        {orderMessage && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
            }}
            onClose={() =>
              setOrderMessage("")
            }
          >
            {orderMessage}
          </Alert>
        )}


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


        {renderPage()}

      </Container>


      {/* =================================================
          RATE & REVIEW DIALOG
      ================================================= */}

      <Dialog
        open={reviewDialogOpen}
        onClose={closeReviewDialog}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#2E7D32",
          }}
        >
          Rate & Review
        </DialogTitle>


        <DialogContent>

          <Typography
            variant="h6"
            sx={{
              mb: 1,
            }}
          >
            {selectedFood?.name ||
              "Food Item"}
          </Typography>


          <Typography
            color="text.secondary"
            sx={{
              mb: 2,
            }}
          >
            How was your experience with
            this food?
          </Typography>


          <Rating
            value={selectedRating}
            onChange={(event, value) =>
              setSelectedRating(
                value || 0
              )
            }
            size="large"
            sx={{
              mb: 3,
            }}
          />


          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Your Review"
            placeholder="Tell us about the taste, quality, spice level, etc."
            value={reviewComment}
            onChange={(e) =>
              setReviewComment(
                e.target.value
              )
            }
          />

        </DialogContent>


        <DialogActions
          sx={{
            p: 2,
          }}
        >

          <Button
            onClick={closeReviewDialog}
            disabled={submittingReview}
          >
            CANCEL
          </Button>


          <Button
            variant="contained"
            onClick={submitReview}
            disabled={
              submittingReview ||
              selectedRating === 0
            }
            sx={{
              backgroundColor:
                "#2E7D32",

              "&:hover": {
                backgroundColor:
                  "#1B5E20",
              },
            }}
          >
            {submittingReview
              ? "Submitting..."
              : "SUBMIT REVIEW"}
          </Button>

        </DialogActions>

      </Dialog>


      {/* =================================================
          FOOD REVIEWS DIALOG
      ================================================= */}

      <Dialog
        open={foodReviewsDialogOpen}
        onClose={closeFoodReviews}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#2E7D32",
          }}
        >
          {selectedFoodForReviews?.name ||
            "Food Reviews"}
        </DialogTitle>


        <DialogContent>

          {loadingFoodReviews ? (

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>

          ) : (

            <>
              {/* AVERAGE RATING */}

              <Box
                sx={{
                  textAlign: "center",
                  mb: 3,
                  p: 3,
                  borderRadius: 3,
                  backgroundColor:
                    "#F5FAF5",
                }}
              >

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: "#2E7D32",
                  }}
                >
                  {selectedFoodTotalReviews >
                    0
                    ? Number(
                      selectedFoodAverageRating
                    ).toFixed(1)
                    : "—"}
                </Typography>


                <Rating
                  value={
                    selectedFoodAverageRating
                  }
                  precision={0.1}
                  readOnly
                  size="large"
                />


                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 1,
                  }}
                >
                  {selectedFoodTotalReviews}{" "}
                  {selectedFoodTotalReviews ===
                    1
                    ? "review"
                    : "reviews"}
                </Typography>

              </Box>


              {/* REVIEWS */}

              {selectedFoodReviews.length ===
                0 ? (

                <Box
                  sx={{
                    textAlign: "center",
                    py: 3,
                  }}
                >

                  <RateReview
                    sx={{
                      fontSize: 55,
                      color: "#2E7D32",
                    }}
                  />

                  <Typography
                    variant="h6"
                    sx={{
                      mt: 1,
                    }}
                  >
                    No reviews yet
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Be the first customer
                    to review this food.
                  </Typography>

                </Box>

              ) : (

                selectedFoodReviews.map(
                  (review) => (

                    <Card
                      key={review._id}
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                      }}
                    >

                      <CardContent>

                        <Box
                          sx={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: 2,
                          }}
                        >

                          <Typography
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {review.userId
                              ?.name ||
                              "Customer"}
                          </Typography>


                          <Rating
                            value={Number(
                              review.rating ||
                              0
                            )}
                            readOnly
                            size="small"
                          />

                        </Box>


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
                              "en-IN"
                            )}
                          </Typography>
                        )}

                      </CardContent>

                    </Card>

                  )
                )

              )}

            </>

          )}

        </DialogContent>


        <DialogActions
          sx={{
            p: 2,
          }}
        >

          <Button
            onClick={closeFoodReviews}
            variant="contained"
            sx={{
              backgroundColor:
                "#2E7D32",

              "&:hover": {
                backgroundColor:
                  "#1B5E20",
              },
            }}
          >
            CLOSE
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};


export default UserDashboard;