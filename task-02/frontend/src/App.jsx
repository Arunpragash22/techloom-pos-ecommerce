import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Task 02 backend
const API = "http://3.80.42.113:8081";

// Create a unique user ID for this browser
const USER_ID =
  localStorage.getItem("ecommerceUserId") ||
  `user-${
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }`;

localStorage.setItem("ecommerceUserId", USER_ID);

function App() {
  // =========================
  // PRODUCT STATE
  // =========================

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
  });

  const [addingProduct, setAddingProduct] = useState(false);

  // =========================
  // CART / ORDER STATE
  // =========================

  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadProducts();
    loadCart();
    loadOrders();
  }, []);

  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Product loading failed:", error);
      setMessage("Unable to load products.");
    }
  };

  // =========================
  // SEARCH PRODUCTS
  // =========================

  const searchProducts = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      loadProducts();
      return;
    }

    try {
      const response = await axios.get(
        `${API}/api/products/search`,
        {
          params: {
            name: value,
          },
        }
      );

      setProducts(response.data);
    } catch (error) {
      console.error("Search failed:", error);
      setMessage("Search failed.");
    }
  };

  // =========================
  // ADD NEW PRODUCT
  // =========================

  const addProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (!newProduct.name.trim()) {
      setMessage("Please enter a product name.");
      return;
    }

    if (!newProduct.price || Number(newProduct.price) < 0) {
      setMessage("Please enter a valid price.");
      return;
    }

    if (
      newProduct.stockQuantity === "" ||
      Number(newProduct.stockQuantity) < 0
    ) {
      setMessage("Please enter a valid stock quantity.");
      return;
    }

    setAddingProduct(true);
    setMessage("");

    try {
      await axios.post(`${API}/api/products`, {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: Number(newProduct.price),
        stockQuantity: Number(newProduct.stockQuantity),
        active: true,
      });

      setMessage("Product added successfully.");

      // Clear form
      setNewProduct({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
      });

      // Refresh product list
      await loadProducts();
    } catch (error) {
      console.error("Product creation failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to add product."
      );
    } finally {
      setAddingProduct(false);
    }
  };

  // =========================
  // LOAD CART
  // =========================

  const loadCart = async () => {
    try {
      const response = await axios.get(
        `${API}/api/cart/${USER_ID}`
      );

      setCart(response.data);
    } catch (error) {
      console.error("Cart loading failed:", error);
    }
  };

  // =========================
  // LOAD ORDER HISTORY
  // =========================

  const loadOrders = async () => {
    try {
      const response = await axios.get(
        `${API}/api/orders/user/${USER_ID}`
      );

      setOrders(response.data);
    } catch (error) {
      console.error(
        "Order history loading failed:",
        error
      );
    }
  };

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = async (product) => {
    if (product.stockQuantity <= 0) {
      setMessage("This product is out of stock.");
      return;
    }

    try {
      await axios.post(
        `${API}/api/cart/${USER_ID}/items`,
        null,
        {
          params: {
            productId: product.id,
            quantity: 1,
          },
        }
      );

      setMessage(`${product.name} added to cart.`);

      await loadCart();
    } catch (error) {
      console.error("Add to cart failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to add product to cart."
      );
    }
  };

  // =========================
  // UPDATE CART QUANTITY
  // =========================

  const updateCartQuantity = async (
    productId,
    quantity
  ) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      await axios.put(
        `${API}/api/cart/${USER_ID}/items/${productId}`,
        null,
        {
          params: {
            quantity,
          },
        }
      );

      await loadCart();

      setMessage("Cart updated.");
    } catch (error) {
      console.error("Cart update failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to update cart."
      );
    }
  };

  // =========================
  // REMOVE CART ITEM
  // =========================

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(
        `${API}/api/cart/${USER_ID}/items/${productId}`
      );

      await loadCart();

      setMessage("Item removed from cart.");
    } catch (error) {
      console.error("Remove item failed:", error);

      setMessage("Unable to remove item.");
    }
  };

  // =========================
  // CLEAR CART
  // =========================

  const clearCart = async () => {
    try {
      await axios.delete(
        `${API}/api/cart/${USER_ID}`
      );

      await loadCart();

      setMessage("Cart cleared.");
    } catch (error) {
      console.error("Clear cart failed:", error);

      setMessage("Unable to clear cart.");
    }
  };

  // =========================
  // CHECKOUT
  // =========================

  const checkout = async () => {
    if (!cart?.items?.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const idempotencyKey =
        `ecommerce-checkout-${Date.now()}`;

      const response = await axios.post(
        `${API}/api/checkout/${USER_ID}`,
        null,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      setCurrentOrder(response.data);

      setMessage(
        "Checkout successful. Stock has been reserved."
      );

      await loadCart();
      await loadProducts();
      await loadOrders();
    } catch (error) {
      console.error("Checkout failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Checkout failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PROCESS PAYMENT
  // =========================

  const processPayment = async (success) => {
    if (!currentOrder) return;

    setPaymentLoading(true);
    setMessage("");

    try {
      await axios.post(
        `${API}/api/payments/${currentOrder.id}`,
        null,
        {
          params: {
            success,
          },
        }
      );

      // Get updated order
      const response = await axios.get(
        `${API}/api/orders/${currentOrder.id}`
      );

      setCurrentOrder(response.data);

      if (success) {
        setMessage(
          "Payment successful. Order confirmed."
        );
      } else {
        setMessage(
          "Payment failed. Reserved stock has been released."
        );
      }

      await loadProducts();
      await loadOrders();
      await loadCart();
    } catch (error) {
      console.error(
        "Payment processing failed:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Payment processing failed."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================
  // CANCEL ORDER
  // =========================

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        `${API}/api/orders/${orderId}/cancel`
      );

      setCurrentOrder(response.data);

      setMessage(
        "Order cancelled and refund simulated."
      );

      await loadProducts();
      await loadOrders();
    } catch (error) {
      console.error("Cancel order failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to cancel order."
      );
    }
  };

  // =========================
  // CART TOTAL
  // =========================

  const getCartTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce(
      (total, item) =>
        total +
        Number(item.product?.price || 0) *
          item.quantity,
      0
    );
  };

  // =========================
  // STATUS CSS
  // =========================

  const getStatusClass = (status) => {
    if (status === "CONFIRMED") {
      return "status success";
    }

    if (status === "PAYMENT_FAILED") {
      return "status failed";
    }

    if (status === "CANCELLED") {
      return "status cancelled";
    }

    if (status === "EXPIRED") {
      return "status expired";
    }

    return "status pending";
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            T
          </div>

          <div>
            <h1>Techloom Store</h1>
            <span>
              Smart shopping experience
            </span>
          </div>
        </div>

        <div className="cart-summary">
          🛒 {cart?.items?.length || 0} items
        </div>
      </header>

      {/* ================= MESSAGE ================= */}

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <main className="container">

        {/* ================= HERO ================= */}

        <section className="hero">
          <div>
            <p className="eyebrow">
              ONLINE STORE
            </p>

            <h2>
              Find what you need.
            </h2>

            <p>
              Browse products, add them to your cart,
              checkout securely and track your orders.
            </p>
          </div>

          <div className="hero-icon">
            🛍️
          </div>
        </section>

        {/* =================================================
            ADD PRODUCT
        ================================================= */}

        <section className="add-product-panel">

          <div className="section-title">
            <div>
              <p className="eyebrow">
                ADMIN
              </p>

              <h2>
                Add New Product
              </h2>

              <p>
                Add a product to the store inventory.
              </p>
            </div>
          </div>

          <form
            onSubmit={addProduct}
            className="product-form"
          >

            {/* Product Name */}

            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  name: e.target.value,
                })
              }
            />

            {/* Description */}

            <input
              type="text"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  description:
                    e.target.value,
                })
              }
            />

            {/* Price */}

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  price: e.target.value,
                })
              }
            />

            {/* Stock */}

            <input
              type="number"
              min="0"
              placeholder="Stock Quantity"
              value={
                newProduct.stockQuantity
              }
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  stockQuantity:
                    e.target.value,
                })
              }
            />

            {/* Submit */}

            <button
              type="submit"
              className="primary-btn"
              disabled={addingProduct}
            >
              {addingProduct
                ? "Adding..."
                : "+ Add Product"}
            </button>

          </form>

        </section>

        {/* =================================================
            PRODUCTS + SEARCH
        ================================================= */}

        <section className="search-section">

          <div className="section-title">
            <div>
              <h2>
                Products
              </h2>

              <p>
                Search and discover available products.
              </p>
            </div>
          </div>

          <div className="search-box">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                searchProducts(
                  e.target.value
                )
              }
            />

          </div>

        </section>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        <section className="products-grid">

          {products.length === 0 ? (

            <div className="empty">

              <h3>
                No products found
              </h3>

              <p>
                Try a different search term.
              </p>

            </div>

          ) : (

            products.map((product) => (

              <article
                className="product-card"
                key={product.id}
              >

                <div className="product-image">
                  🛒
                </div>

                <div className="product-info">

                  <div className="product-top">

                    <h3>
                      {product.name}
                    </h3>

                    <span
                      className={
                        product.stockQuantity > 0
                          ? "stock available"
                          : "stock unavailable"
                      }
                    >
                      {product.stockQuantity > 0
                        ? `${product.stockQuantity} left`
                        : "Out of stock"}
                    </span>

                  </div>

                  <p>
                    {product.description ||
                      "Quality product from Techloom Store."}
                  </p>

                  <div className="product-bottom">

                    <strong>
                      Rs.{" "}
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </strong>

                    <button
                      className="primary-btn"
                      disabled={
                        product.stockQuantity <= 0
                      }
                      onClick={() =>
                        addToCart(product)
                      }
                    >
                      Add to Cart
                    </button>

                  </div>

                  <button
                    className="details-btn"
                    onClick={() =>
                      setSelectedProduct(
                        product
                      )
                    }
                  >
                    View Details
                  </button>

                </div>

              </article>

            ))

          )}

        </section>

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        {selectedProduct && (

          <section className="details-panel">

            <div className="details-header">

              <div>

                <p className="eyebrow">
                  PRODUCT DETAILS
                </p>

                <h2>
                  {selectedProduct.name}
                </h2>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedProduct(null)
                }
              >
                ×
              </button>

            </div>

            <p>
              {selectedProduct.description ||
                "No description available."}
            </p>

            <div className="details-grid">

              <div>
                <span>
                  Price
                </span>

                <strong>
                  Rs.{" "}
                  {Number(
                    selectedProduct.price
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Available Stock
                </span>

                <strong>
                  {
                    selectedProduct.stockQuantity
                  }
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong>
                  {selectedProduct.active
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>

            </div>

          </section>

        )}

        {/* =================================================
            CART
        ================================================= */}

        <section className="shopping-layout">

          <div className="cart-panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Your Cart
                </h2>

                <p>
                  Review your items before checkout.
                </p>

              </div>

            </div>

            {!cart?.items?.length ? (

              <div className="empty-cart">

                <div>
                  🛒
                </div>

                <h3>
                  Your cart is empty
                </h3>

                <p>
                  Add some products to continue.
                </p>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.items.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-item-icon">
                        📦
                      </div>

                      <div className="cart-item-info">

                        <h3>
                          {item.product?.name}
                        </h3>

                        <span>
                          Rs.{" "}
                          {Number(
                            item.product?.price ||
                              0
                          ).toFixed(2)}
                        </span>

                      </div>

                      <div className="quantity-control">

                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.quantity - 1
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>

                      </div>

                      <strong className="item-total">
                        Rs.{" "}
                        {(
                          Number(
                            item.product?.price ||
                              0
                          ) * item.quantity
                        ).toFixed(2)}
                      </strong>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeFromCart(
                            item.product.id
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  ))}

                </div>

                {/* Cart footer */}

                <div className="cart-footer">

                  <div>

                    <span>
                      Total
                    </span>

                    <strong>
                      Rs.{" "}
                      {getCartTotal().toFixed(2)}
                    </strong>

                  </div>

                  <div className="cart-actions">

                    <button
                      className="secondary-btn"
                      onClick={clearCart}
                    >
                      Clear Cart
                    </button>

                    <button
                      className="primary-btn large"
                      onClick={checkout}
                      disabled={loading}
                    >
                      {loading
                        ? "Processing..."
                        : "Checkout"}
                    </button>

                  </div>

                </div>

              </>

            )}

          </div>

        </section>

        {/* =================================================
            CURRENT ORDER
        ================================================= */}

        {currentOrder && (

          <section className="order-panel">

            <div className="panel-heading">

              <div>

                <p className="eyebrow">
                  CURRENT ORDER
                </p>

                <h2>
                  Order #{currentOrder.id}
                </h2>

              </div>

              <span
                className={getStatusClass(
                  currentOrder.status
                )}
              >
                {currentOrder.status}
              </span>

            </div>

            <div className="order-summary">

              <div>

                <span>
                  Total Amount
                </span>

                <strong>
                  Rs.{" "}
                  {Number(
                    currentOrder.totalAmount
                  ).toFixed(2)}
                </strong>

              </div>

              <div>

                <span>
                  Created
                </span>

                <strong>
                  {currentOrder.createdAt
                    ? new Date(
                        currentOrder.createdAt
                      ).toLocaleString()
                    : "-"}
                </strong>

              </div>

              <div>

                <span>
                  Reservation
                </span>

                <strong>
                  {currentOrder.reservationExpiresAt
                    ? new Date(
                        currentOrder.reservationExpiresAt
                      ).toLocaleTimeString()
                    : "-"}
                </strong>

              </div>

            </div>

            {/* Payment */}

            {currentOrder.status ===
              "PENDING_PAYMENT" && (

              <div className="payment-box">

                <h3>
                  Mock Payment Gateway
                </h3>

                <p>
                  Select a payment result to test
                  the checkout flow.
                </p>

                <div className="payment-actions">

                  <button
                    className="success-btn"
                    disabled={paymentLoading}
                    onClick={() =>
                      processPayment(true)
                    }
                  >
                    ✓ Payment Success
                  </button>

                  <button
                    className="danger-btn"
                    disabled={paymentLoading}
                    onClick={() =>
                      processPayment(false)
                    }
                  >
                    ✕ Payment Failed
                  </button>

                </div>

              </div>

            )}

            {/* Cancel */}

            {currentOrder.status ===
              "CONFIRMED" && (

              <button
                className="danger-btn"
                onClick={() =>
                  cancelOrder(
                    currentOrder.id
                  )
                }
              >
                Cancel Order & Simulate Refund
              </button>

            )}

          </section>

        )}

        {/* =================================================
            ORDER HISTORY
        ================================================= */}

        <section className="history-panel">

          <div className="panel-heading">

            <div>

              <p className="eyebrow">
                ACCOUNT
              </p>

              <h2>
                Order History
              </h2>

              <p>
                View your previous orders and their
                current status.
              </p>

            </div>

            <button
              className="secondary-btn"
              onClick={loadOrders}
            >
              Refresh
            </button>

          </div>

          {orders.length === 0 ? (

            <div className="empty">

              <h3>
                No orders yet
              </h3>

              <p>
                Your completed checkout orders will
                appear here.
              </p>

            </div>

          ) : (

            <div className="orders-list">

              {orders.map((order) => (

                <div
                  className="history-order"
                  key={order.id}
                >

                  <div>

                    <strong>
                      Order #{order.id}
                    </strong>

                    <span>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleString()
                        : "-"}
                    </span>

                  </div>

                  <strong>
                    Rs.{" "}
                    {Number(
                      order.totalAmount
                    ).toFixed(2)}
                  </strong>

                  <span
                    className={getStatusClass(
                      order.status
                    )}
                  >
                    {order.status}
                  </span>

                  {(order.status ===
                    "CONFIRMED" ||
                    order.status ===
                      "PENDING_PAYMENT") && (

                    <button
                      className="details-btn"
                      onClick={() =>
                        setCurrentOrder(
                          order
                        )
                      }
                    >
                      View
                    </button>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <footer>
        <p>
          Techloom Store · E-Commerce Checkout &
          Payment System
        </p>
      </footer>

    </div>
  );
}

export default App;