import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Rating,
  Stack,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Restaurant,
  ReceiptLong,
  LocalFireDepartment,
  CheckCircle,
  DoneAll,
  Logout,
  Dashboard,
  Inventory,
  RateReview,
  Star,
} from "@mui/icons-material";

const StaffDashboard = ({ user, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // REVIEWS STATE
  // =====================================================

  const [foodReviews, setFoodReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // =====================================================
  // MENU AVAILABILITY STATE
  // =====================================================

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  // =====================================================
  // LOAD ORDERS FROM MONGODB
  // =====================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your login session has expired. Please login again.");
        return;
      }

      const response = await axios.get("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const apiOrders = Array.isArray(response.data)
        ? response.data
        : response.data.orders || [];

      /*
        Backend Order structure:

        {
          _id,
          orderNumber,
          userId,
          items: [
            {
              menuItemId,
              name,
              price,
              quantity,
              subtotal,
              image
            }
          ],
          totalAmount,
          status,
          paymentMethod,
          paymentStatus,
          specialRequests
        }

        Existing Staff UI expects:

        itemName
        customerName
        quantity
        price

        So we convert the new Order structure
        without changing the existing UI.
      */

      const staffOrders = apiOrders.map((order) => {
        const totalQuantity = (order.items || []).reduce(
          (total, item) => total + Number(item.quantity || 0),
          0
        );

        return {
          ...order,

          itemName: (order.items || [])
            .map(
              (item) => `${item.name} × ${item.quantity}`
            )
            .join(", "),

          quantity: totalQuantity,

          price:
            totalQuantity > 0
              ? order.totalAmount / totalQuantity
              : 0,

          customerName:
            order.userId?.name ||
            order.customerName ||
            "Customer",

          specialInstructions:
            order.specialRequests || "",
        };
      });

      setOrders(staffOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD FOOD REVIEWS
  // =====================================================

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);

      const menuResponse = await axios.get("/api/menu");

      const menuItems = Array.isArray(menuResponse.data)
        ? menuResponse.data
        : menuResponse.data.menu || [];

      const reviewResults = await Promise.all(
        menuItems.map(async (food) => {
          try {
            const response = await axios.get(
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
              `Unable to load reviews for ${food.name}:`,
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

      /*
        Keep foods that have reviews.

        This prevents the staff page from becoming
        filled with foods that have no customer feedback.
      */
      const foodsWithReviews = reviewResults.filter(
        (food) => food.totalReviews > 0
      );

      setFoodReviews(foodsWithReviews);
    } catch (err) {
      console.error("Error fetching food reviews:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load food reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  // =====================================================
  // LOAD MENU AVAILABILITY
  // =====================================================

  const fetchMenuItems = async () => {
    try {
      setMenuLoading(true);

      const response = await axios.get("/api/menu");

      const items = Array.isArray(response.data)
        ? response.data
        : response.data.menu || [];

      setMenuItems(items);
    } catch (err) {
      console.error("Error fetching menu:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load menu availability."
      );
    } finally {
      setMenuLoading(false);
    }
  };
  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    fetchOrders();
    fetchReviews();
    fetchMenuItems();

    const interval = setInterval(() => {
      fetchOrders();
      fetchReviews();
      fetchMenuItems();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateStatus = async (id, status) => {
    try {
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Your login session has expired. Please login again."
        );
        return;
      }

      await axios.patch(
        `/api/orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `Order status changed to ${status}.`
      );

      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update order status."
      );
    }
  };

  // =====================================================
  // FILTER ORDERS BY STATUS
  // =====================================================

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Pending"
      ),
    [orders]
  );

  const preparingOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Preparing"
      ),
    [orders]
  );

  const readyOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Ready"
      ),
    [orders]
  );

  const servedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Served"
      ),
    [orders]
  );

  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = (page) => {
    setActivePage(page);
    setDrawerOpen(false);
    setMessage("");
    setError("");
  };

  // =====================================================
  // ORDER CARD
  // =====================================================

  const renderOrderCard = (order) => (
    <Card
      key={order._id}
      sx={{
        borderRadius: 3,
        mb: 2,
        boxShadow:
          "0 4px 15px rgba(0,0,0,0.08)",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
              }}
            >
              {order.itemName}
            </Typography>

            <Typography color="text.secondary">
              Customer: {order.customerName}
            </Typography>

            <Typography color="text.secondary">
              Quantity: {order.quantity}
            </Typography>

            <Typography color="text.secondary">
              Total: ₹{order.totalAmount}
            </Typography>

            {order.orderNumber && (
              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Token: {order.orderNumber}
              </Typography>
            )}
          </Box>

          <Chip
            label={order.status}
            color={
              order.status === "Pending"
                ? "info"
                : order.status === "Preparing"
                  ? "warning"
                  : order.status === "Ready"
                    ? "success"
                    : "default"
            }
          />
        </Box>

        {order.specialInstructions && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Customer Special Requirement
            </Typography>

            {order.specialInstructions}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {order.status === "Pending" && (
            <Button
              variant="contained"
              color="warning"
              startIcon={
                <LocalFireDepartment />
              }
              onClick={() =>
                updateStatus(
                  order._id,
                  "Preparing"
                )
              }
            >
              Start Preparing
            </Button>
          )}

          {order.status === "Preparing" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() =>
                updateStatus(
                  order._id,
                  "Ready"
                )
              }
            >
              Mark Ready
            </Button>
          )}

          {order.status === "Ready" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<DoneAll />}
              onClick={() =>
                updateStatus(
                  order._id,
                  "Served"
                )
              }
            >
              Mark Served
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  // =====================================================
  // DASHBOARD
  // =====================================================

  const renderDashboard = () => (
    <>
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 4,
          background:
            "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
          color: "white",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 800 }}
        >
          Welcome, {user.name}
        </Typography>

        <Typography sx={{ mt: 1 }}>
          Staff Kitchen Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent
              sx={{ textAlign: "center" }}
            >
              <ReceiptLong
                sx={{
                  fontSize: 45,
                  color: "#1976d2",
                }}
              />

              <Typography
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {orders.length}
              </Typography>

              <Typography>
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent
              sx={{ textAlign: "center" }}
            >
              <ReceiptLong
                sx={{
                  fontSize: 45,
                  color: "#0288d1",
                }}
              />

              <Typography
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {pendingOrders.length}
              </Typography>

              <Typography>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent
              sx={{ textAlign: "center" }}
            >
              <LocalFireDepartment
                sx={{
                  fontSize: 45,
                  color: "#ed6c02",
                }}
              />

              <Typography
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {preparingOrders.length}
              </Typography>

              <Typography>
                Preparing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent
              sx={{ textAlign: "center" }}
            >
              <CheckCircle
                sx={{
                  fontSize: 45,
                  color: "#2e7d32",
                }}
              />

              <Typography
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {readyOrders.length}
              </Typography>

              <Typography>
                Ready
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#2E7D32",
            mb: 3,
          }}
        >
          Active Orders
        </Typography>

        {loading ? (
          <Box
            sx={{
              textAlign: "center",
              py: 5,
            }}
          >
            <CircularProgress />
          </Box>
        ) : pendingOrders.length === 0 &&
          preparingOrders.length === 0 &&
          readyOrders.length === 0 ? (
          <Card
            sx={{
              p: 5,
              textAlign: "center",
            }}
          >
            <Typography variant="h6">
              No active orders
            </Typography>
          </Card>
        ) : (
          <>
            {pendingOrders.map(
              renderOrderCard
            )}

            {preparingOrders.map(
              renderOrderCard
            )}

            {readyOrders.map(
              renderOrderCard
            )}
          </>
        )}
      </Box>
    </>
  );

  // =====================================================
  // NEW ORDERS
  // =====================================================

  const renderNewOrders = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        New Orders
      </Typography>

      {pendingOrders.length === 0 ? (
        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            No new orders
          </Typography>
        </Card>
      ) : (
        pendingOrders.map(
          renderOrderCard
        )
      )}
    </>
  );

  // =====================================================
  // PREPARING
  // =====================================================

  const renderPreparing = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        Preparing Orders
      </Typography>

      {preparingOrders.length === 0 ? (
        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            No orders are currently being prepared
          </Typography>
        </Card>
      ) : (
        preparingOrders.map(
          renderOrderCard
        )
      )}
    </>
  );

  // =====================================================
  // READY
  // =====================================================

  const renderReady = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        Ready Orders
      </Typography>

      {readyOrders.length === 0 ? (
        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            No ready orders
          </Typography>
        </Card>
      ) : (
        readyOrders.map(
          renderOrderCard
        )
      )}
    </>
  );

  // =====================================================
  // SERVED
  // =====================================================

  const renderServed = () => (
    <>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#2E7D32",
          mb: 3,
        }}
      >
        Served Orders
      </Typography>

      {servedOrders.length === 0 ? (
        <Card
          sx={{
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            No served orders yet
          </Typography>
        </Card>
      ) : (
        servedOrders.map(
          renderOrderCard
        )
      )}
    </>
  );

  // =====================================================
  // MENU AVAILABILITY
  // =====================================================

  const renderMenuAvailability = () => (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#2E7D32",
            }}
          >
            Menu Availability
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            View current food availability and stock.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Inventory />}
          onClick={fetchMenuItems}
          disabled={menuLoading}
        >
          Refresh Menu
        </Button>
      </Box>

      {menuLoading ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          <CircularProgress />

          <Typography
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Loading menu...
          </Typography>
        </Box>
      ) : menuItems.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          <Inventory
            sx={{
              fontSize: 60,
              color: "#2E7D32",
              mb: 2,
            }}
          />

          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            No menu items found
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Menu items added by Admin will appear here.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {menuItems.map((item) => {
            const stock = Number(item.stock || 0);

            const isAvailable =
              item.available === true && stock > 0;

            const isOutOfStock = stock === 0;

            const isLowStock =
              stock > 0 && stock <= 5;

            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={item._id}
              >
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow:
                      "0 4px 15px rgba(0,0,0,0.08)",
                  }}
                >
                  {item.image ? (
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: "100%",
                        height: 170,
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 170,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#e8f5e9",
                      }}
                    >
                      <Restaurant
                        sx={{
                          fontSize: 60,
                          color: "#2E7D32",
                        }}
                      />
                    </Box>
                  )}

                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        mb: 2,
                      }}
                    />

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 18,
                        mb: 1,
                      }}
                    >
                      ₹{item.price}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Stock:{" "}
                      <strong>{stock}</strong>
                    </Typography>

                    {isOutOfStock ? (
                      <Chip
                        label="Out of Stock"
                        color="error"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    ) : !item.available ? (
                      <Chip
                        label="Unavailable"
                        color="default"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    ) : isLowStock ? (
                      <Chip
                        label="Low Stock"
                        color="warning"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <Chip
                        label="Available"
                        color="success"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    )}
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
  // REVIEWS
  // =====================================================

  const renderReviews = () => (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#2E7D32",
            }}
          >
            Customer Reviews
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Read customer feedback for each food item.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RateReview />}
          onClick={fetchReviews}
          disabled={reviewsLoading}
        >
          Refresh Reviews
        </Button>
      </Box>

      {reviewsLoading ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          <CircularProgress />

          <Typography
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Loading customer reviews...
          </Typography>
        </Box>
      ) : foodReviews.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          <RateReview
            sx={{
              fontSize: 60,
              color: "#2E7D32",
              mb: 2,
            }}
          />

          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            No customer reviews yet
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Customer ratings and comments will appear
            here after they review their served orders.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {foodReviews.map((food) => (
            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={food.foodId}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.08)",
                }}
              >
                {food.foodImage && (
                  <Box
                    component="img"
                    src={food.foodImage}
                    alt={food.foodName}
                    sx={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                )}

                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                    }}
                  >
                    {food.foodName}
                  </Typography>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Rating
                      value={food.averageRating}
                      precision={0.1}
                      readOnly
                    />

                    <Typography
                      sx={{ fontWeight: 700 }}
                    >
                      {food.averageRating.toFixed(1)}
                    </Typography>
                  </Stack>

                  <Typography
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {food.totalReviews}{" "}
                    {food.totalReviews === 1
                      ? "review"
                      : "reviews"}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    {food.reviews.map(
                      (review, index) => (
                        <Box
                          key={
                            review._id ||
                            `${food.foodId}-${index}`
                          }
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: "#f5f7f5",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "flex-start",
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

                          {review.comment && (
                            <Typography
                              sx={{
                                mt: 1,
                                color:
                                  "text.secondary",
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
                                display: "block",
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
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  // =====================================================
  // PAGE ROUTING
  // =====================================================

  const renderPage = () => {
    if (activePage === "dashboard")
      return renderDashboard();

    if (activePage === "newOrders")
      return renderNewOrders();

    if (activePage === "preparing")
      return renderPreparing();

    if (activePage === "ready")
      return renderReady();

    if (activePage === "served")
      return renderServed();

    if (activePage === "menu")
      return renderMenuAvailability();

    if (activePage === "reviews")
      return renderReviews();

    return renderDashboard();
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

          <Restaurant sx={{ mx: 1 }} />

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
            Staff
          </Typography>
        </Toolbar>
      </AppBar>

      {/* =====================================================
          DRAWER
      ===================================================== */}

      <Drawer
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
      >
        <Box sx={{ width: 280 }}>
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
              sx={{ fontWeight: 800 }}
            >
              CanteenPro
            </Typography>

            <Typography>
              Staff Panel
            </Typography>
          </Box>

          <List>
            {/* Dashboard */}

            <ListItemButton
              selected={
                activePage === "dashboard"
              }
              onClick={() =>
                navigate("dashboard")
              }
            >
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>

              <ListItemText
                primary="Dashboard"
              />
            </ListItemButton>

            {/* New Orders */}

            <ListItemButton
              selected={
                activePage === "newOrders"
              }
              onClick={() =>
                navigate("newOrders")
              }
            >
              <ListItemIcon>
                <ReceiptLong />
              </ListItemIcon>

              <ListItemText
                primary="New Orders"
              />
            </ListItemButton>

            {/* Preparing */}

            <ListItemButton
              selected={
                activePage === "preparing"
              }
              onClick={() =>
                navigate("preparing")
              }
            >
              <ListItemIcon>
                <LocalFireDepartment />
              </ListItemIcon>

              <ListItemText
                primary="Preparing"
              />
            </ListItemButton>

            {/* Ready */}

            <ListItemButton
              selected={
                activePage === "ready"
              }
              onClick={() =>
                navigate("ready")
              }
            >
              <ListItemIcon>
                <CheckCircle />
              </ListItemIcon>

              <ListItemText
                primary="Ready"
              />
            </ListItemButton>

            {/* Served */}

            <ListItemButton
              selected={
                activePage === "served"
              }
              onClick={() =>
                navigate("served")
              }
            >
              <ListItemIcon>
                <DoneAll />
              </ListItemIcon>

              <ListItemText
                primary="Served"
              />
            </ListItemButton>

            {/* Menu Availability */}

            <ListItemButton
              selected={
                activePage === "menu"
              }
              onClick={() =>
                navigate("menu")
              }
            >
              <ListItemIcon>
                <Inventory />
              </ListItemIcon>

              <ListItemText
                primary="Menu Availability"
              />
            </ListItemButton>

            {/* Reviews */}

            <ListItemButton
              selected={
                activePage === "reviews"
              }
              onClick={() =>
                navigate("reviews")
              }
            >
              <ListItemIcon>
                <RateReview
                  sx={{
                    color: "#2E7D32",
                  }}
                />
              </ListItemIcon>

              <ListItemText
                primary="Customer Reviews"
              />
            </ListItemButton>

            <Divider />

            {/* Logout */}

            <ListItemButton
              onClick={onLogout}
            >
              <ListItemIcon>
                <Logout color="error" />
              </ListItemIcon>

              <ListItemText
                primary="Logout"
                sx={{
                  color: "error.main",
                }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <Container
        maxWidth="xl"
        sx={{ py: 4 }}
      >
        {message && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {renderPage()}
      </Container>
    </Box>
  );
};

export default StaffDashboard;