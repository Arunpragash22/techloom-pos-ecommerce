import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://100.48.83.254:8080";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userId] = useState("pos-user");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/api/products`);
      setProducts(response.data);
    } catch (error) {
      setMessage("Unable to connect to POS backend.");
    }
  };

  const loadCart = async () => {
    try {
      const response = await axios.get(
        `${API}/api/cart/${userId}`
      );

      setCart(response.data.items || []);
    } catch (error) {
      setMessage("Unable to load cart.");
    }
  };

  const addToCart = async (product) => {
    try {
      await axios.post(
        `${API}/api/cart/${userId}/items`,
        null,
        {
          params: {
            productId: product.id,
            quantity: 1,
          },
        }
      );

      setMessage(`${product.name} added to cart.`);
      loadCart();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to add product to cart."
      );
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(
        `${API}/api/cart/${userId}/items/${productId}`
      );

      setMessage("Item removed from cart.");
      loadCart();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to remove item."
      );
    }
  };

  const checkout = async () => {
    if (cart.length === 0) {
      setMessage("Cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/api/checkout/${userId}`,
        null,
        {
          headers: {
            "Idempotency-Key": `pos-checkout-${Date.now()}`,
          },
        }
      );

      setCurrentOrder(response.data);

      setMessage(
        `Order #${response.data.id} created. Payment pending.`
      );

      setCart([]);
      loadProducts();
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

    try {
      const response = await axios.post(
        `${API}/api/payments/${currentOrder.id}`,
        null,
        {
          params: {
            success,
          },
        }
      );

      if (success) {
        setMessage(
          `Payment successful for Order #${currentOrder.id}.`
        );
      } else {
        setMessage(
          `Payment failed for Order #${currentOrder.id}. Stock released.`
        );
      }

      await loadOrder(currentOrder.id);

      loadProducts();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Payment processing failed."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const loadOrder = async (orderId) => {
    try {
      const response = await axios.get(
        `${API}/api/orders/${orderId}`
      );

      setCurrentOrder(response.data);
    } catch (error) {
      setMessage("Unable to load order.");
    }
  };

  const cancelOrder = async () => {
    if (!currentOrder) return;

    try {
      const response = await axios.post(
        `${API}/api/orders/${currentOrder.id}/cancel`
      );

      setCurrentOrder(response.data);

      setMessage(
        `Order #${currentOrder.id} cancelled and payment refunded.`
      );

      loadProducts();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to cancel order."
      );
    }
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.subtotal || 0),
    0
  );

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Techloom POS</h1>
          <p>Order & Inventory Management</p>
        </div>

        <div className="user-badge">
          User: {userId}
        </div>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <main className="container">

        {/* PRODUCTS */}
        <section className="products-section">

          <div className="section-title">
            <h2>Products</h2>

            <button onClick={loadProducts}>
              Refresh Stock
            </button>
          </div>

          <div className="product-grid">

            {products.map((product) => (
              <div
                className="product-card"
                key={product.id}
              >

                <div className="product-icon">
                  🛍️
                </div>

                <h3>{product.name}</h3>

                <p className="description">
                  {product.description}
                </p>

                <div className="product-info">

                  <strong>
                    Rs.{" "}
                    {Number(product.price).toLocaleString()}
                  </strong>

                  <span
                    className={
                      product.stockQuantity > 0
                        ? "stock available"
                        : "stock unavailable"
                    }
                  >
                    Stock: {product.stockQuantity}
                  </span>

                </div>

                <button
                  className="add-button"
                  disabled={
                    !product.active ||
                    product.stockQuantity <= 0
                  }
                  onClick={() =>
                    addToCart(product)
                  }
                >
                  {product.stockQuantity > 0
                    ? "Add to Cart"
                    : "Out of Stock"}
                </button>

              </div>
            ))}

          </div>

        </section>

        {/* RIGHT SIDE */}
        <aside>

          {/* CART */}
          <div className="cart-section">

            <div className="cart-header">
              <h2>Cart</h2>

              <span>
                {cart.length} item(s)
              </span>
            </div>

            {cart.length === 0 ? (

              <div className="empty-cart">
                <div>🛒</div>

                <p>
                  Your cart is empty.
                </p>

                <small>
                  Add products to start an order.
                </small>
              </div>

            ) : (

              <>
                <div className="cart-items">

                  {cart.map((item) => (
                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div>
                        <strong>
                          {item.product.name}
                        </strong>

                        <p>
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="cart-item-right">

                        <strong>
                          Rs.{" "}
                          {Number(
                            item.subtotal
                          ).toLocaleString()}
                        </strong>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.product.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  ))}

                </div>

                <div className="cart-total">
                  <span>Total</span>

                  <strong>
                    Rs.{" "}
                    {total.toLocaleString()}
                  </strong>
                </div>

                <button
                  className="checkout-button"
                  onClick={checkout}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : "Proceed to Checkout"}
                </button>

              </>
            )}

          </div>

          {/* ORDER / PAYMENT */}
          {currentOrder && (
            <div className="order-section">

              <div className="order-header">
                <h2>
                  Order #{currentOrder.id}
                </h2>

                <span
                  className={`order-status ${currentOrder.status
                    ?.toLowerCase()
                    .replace("_", "-")}`}
                >
                  {currentOrder.status}
                </span>
              </div>

              <div className="order-details">

                <p>
                  <span>Total</span>

                  <strong>
                    Rs.{" "}
                    {Number(
                      currentOrder.totalAmount
                    ).toLocaleString()}
                  </strong>
                </p>

                <p>
                  <span>Customer</span>
                  <strong>
                    {currentOrder.userId}
                  </strong>
                </p>

              </div>

              {currentOrder.status ===
                "PENDING_PAYMENT" && (

                <div className="payment-actions">

                  <p>
                    Payment is pending
                  </p>

                  <button
                    className="success-button"
                    disabled={paymentLoading}
                    onClick={() =>
                      processPayment(true)
                    }
                  >
                    ✓ Pay Successfully
                  </button>

                  <button
                    className="failure-button"
                    disabled={paymentLoading}
                    onClick={() =>
                      processPayment(false)
                    }
                  >
                    ✕ Payment Failed
                  </button>

                </div>
              )}

              {currentOrder.status ===
                "CONFIRMED" && (

                <button
                  className="cancel-button"
                  onClick={cancelOrder}
                >
                  Cancel Order & Refund
                </button>
              )}

              {currentOrder.status ===
                "PAYMENT_FAILED" && (

                <div className="status-message">
                  Payment failed. Reserved stock
                  has been released.
                </div>
              )}

              {currentOrder.status ===
                "EXPIRED" && (

                <div className="status-message">
                  Payment window expired.
                  Reserved stock has been released.
                </div>
              )}

              {currentOrder.status ===
                "CANCELLED" && (

                <div className="status-message">
                  Order cancelled successfully.
                  Payment refunded.
                </div>
              )}

            </div>
          )}

        </aside>

      </main>

    </div>
  );
}

export default App;