import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://100.48.83.254:8081";
const USER_ID =
  localStorage.getItem("ecommerceUserId") ||
  `user-${crypto.randomUUID()}`;

localStorage.setItem("ecommerceUserId", USER_ID);

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCart();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/api/products`);
      setProducts(response.data);
    } catch (error) {
      setMessage("Unable to load products.");
    }
  };

  const searchProducts = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      loadProducts();
      return;
    }

    try {
      const response = await axios.get(
        `${API}/api/products/search`,
        { params: { name: value } }
      );

      setProducts(response.data);
    } catch (error) {
      setMessage("Search failed.");
    }
  };

  const loadCart = async () => {
    try {
      const response = await axios.get(`${API}/api/cart/${USER_ID}`);
      setCart(response.data);
    } catch (error) {
      console.error("Cart loading failed:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(
        `${API}/api/orders/user/${USER_ID}`
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Order history loading failed:", error);
    }
  };

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
      setMessage(
        error.response?.data?.message ||
        "Unable to add product to cart."
      );
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      await axios.put(
        `${API}/api/cart/${USER_ID}/items/${productId}`,
        null,
        { params: { quantity } }
      );

      await loadCart();
      setMessage("Cart updated.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to update cart."
      );
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(
        `${API}/api/cart/${USER_ID}/items/${productId}`
      );

      await loadCart();
      setMessage("Item removed from cart.");
    } catch (error) {
      setMessage("Unable to remove item.");
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/api/cart/${USER_ID}`);
      await loadCart();
      setMessage("Cart cleared.");
    } catch (error) {
      setMessage("Unable to clear cart.");
    }
  };

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
      setMessage(
        error.response?.data?.message ||
        "Checkout failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (success) => {
    if (!currentOrder) return;

    setPaymentLoading(true);
    setMessage("");

    try {
      await axios.post(
        `${API}/api/payments/${currentOrder.id}`,
        null,
        {
          params: { success },
        }
      );

      const response = await axios.get(
        `${API}/api/orders/${currentOrder.id}`
      );

      setCurrentOrder(response.data);

      if (success) {
        setMessage("Payment successful. Order confirmed.");
      } else {
        setMessage(
          "Payment failed. Reserved stock has been released."
        );
      }

      await loadProducts();
      await loadOrders();
      await loadCart();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Payment processing failed."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

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
      setMessage(
        error.response?.data?.message ||
        "Unable to cancel order."
      );
    }
  };

  const getCartTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce(
      (total, item) =>
        total +
        Number(item.product?.price || 0) * item.quantity,
      0
    );
  };

  const getStatusClass = (status) => {
    if (status === "CONFIRMED") return "status success";
    if (status === "PAYMENT_FAILED") return "status failed";
    if (status === "CANCELLED") return "status cancelled";
    if (status === "EXPIRED") return "status expired";

    return "status pending";
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <h1>Techloom Store</h1>
            <span>Smart shopping experience</span>
          </div>
        </div>

        <div className="cart-summary">
          🛒 {cart?.items?.length || 0} items
        </div>
      </header>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">ONLINE STORE</p>
            <h2>Find what you need.</h2>
            <p>
              Browse products, add them to your cart,
              checkout securely and track your orders.
            </p>
          </div>

          <div className="hero-icon">🛍️</div>
        </section>

        <section className="search-section">
          <div className="section-title">
            <div>
              <h2>Products</h2>
              <p>Search and discover available products.</p>
            </div>
          </div>

          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                searchProducts(e.target.value)
              }
            />
          </div>
        </section>

        <section className="products-grid">
          {products.length === 0 ? (
            <div className="empty">
              <h3>No products found</h3>
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
                    <h3>{product.name}</h3>

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
                      Rs. {Number(product.price).toFixed(2)}
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
                      setSelectedProduct(product)
                    }
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {selectedProduct && (
          <section className="details-panel">
            <div className="details-header">
              <div>
                <p className="eyebrow">PRODUCT DETAILS</p>
                <h2>{selectedProduct.name}</h2>
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
                <span>Price</span>
                <strong>
                  Rs.{" "}
                  {Number(
                    selectedProduct.price
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Available Stock</span>
                <strong>
                  {selectedProduct.stockQuantity}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedProduct.active
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>
            </div>
          </section>
        )}

        <section className="shopping-layout">
          <div className="cart-panel">
            <div className="panel-heading">
              <div>
                <h2>Your Cart</h2>
                <p>
                  Review your items before checkout.
                </p>
              </div>
            </div>

            {!cart?.items?.length ? (
              <div className="empty-cart">
                <div>🛒</div>
                <h3>Your cart is empty</h3>
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
                            item.product?.price || 0
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

                        <span>{item.quantity}</span>

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
                            item.product?.price || 0
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

                <div className="cart-footer">
                  <div>
                    <span>Total</span>
                    <strong>
                      Rs. {getCartTotal().toFixed(2)}
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

        {currentOrder && (
          <section className="order-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CURRENT ORDER</p>
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
                <span>Total Amount</span>
                <strong>
                  Rs.{" "}
                  {Number(
                    currentOrder.totalAmount
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {currentOrder.createdAt
                    ? new Date(
                        currentOrder.createdAt
                      ).toLocaleString()
                    : "-"}
                </strong>
              </div>

              <div>
                <span>Reservation</span>
                <strong>
                  {currentOrder.reservationExpiresAt
                    ? new Date(
                        currentOrder.reservationExpiresAt
                      ).toLocaleTimeString()
                    : "-"}
                </strong>
              </div>
            </div>

            {currentOrder.status ===
              "PENDING_PAYMENT" && (
              <div className="payment-box">
                <h3>Mock Payment Gateway</h3>
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

            {currentOrder.status ===
              "CONFIRMED" && (
              <button
                className="danger-btn"
                onClick={() =>
                  cancelOrder(currentOrder.id)
                }
              >
                Cancel Order & Simulate Refund
              </button>
            )}
          </section>
        )}

        <section className="history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ACCOUNT</p>
              <h2>Order History</h2>
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
              <h3>No orders yet</h3>
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

                  {(order.status === "CONFIRMED" ||
                    order.status ===
                      "PENDING_PAYMENT") && (
                    <button
                      className="details-btn"
                      onClick={() =>
                        setCurrentOrder(order)
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