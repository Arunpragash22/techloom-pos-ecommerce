````markdown
# Techloom.ai Software Engineer Intern Assessment

This repository contains the two tasks completed for the Techloom.ai Software Engineer Intern practical assessment.

## Live Applications

- **Task 01 - POS Order & Inventory System:** http://100.48.83.254:5173
- **Task 02 - E-Commerce Checkout & Payment System:** http://100.48.83.254:5174
- **GitHub Repository:** https://github.com/Arunpragash22/techloom-pos-ecommerce

---

# Tasks

- Task 01 - POS Order & Inventory System
- Task 02 - E-Commerce Checkout & Payment System

---

# Task 01 - POS Order & Inventory System

## Overview

A backend system for managing products, carts, orders, stock reservations, and mock payments.

The system focuses on safe stock handling during checkout and prevents overselling when multiple users try to purchase the same product.

## Tech Stack

- Java 21
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Maven
- REST API
- React
- Vite
- Axios
- Git & GitHub
- AWS EC2
- AWS RDS

## Implemented Features

- Product CRUD
- Product creation from frontend
- Cart management
- Checkout
- Stock reservation
- Mock payment processing
- Payment success and failure handling
- Stock release after payment failure
- 5-minute reservation expiry
- Automatic stock release after reservation expiry
- Order cancellation
- Mock refund handling
- Idempotency protection
- Pessimistic database locking
- Overselling protection
- Global exception handling
- PostgreSQL database persistence

## Project Structure

```text
task-01/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── pom.xml
│   └── mvnw.cmd
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
````

## Backend API

### Products

```text
POST   /api/products
GET    /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

### Cart

```text
POST   /api/cart/{userId}/items
GET    /api/cart/{userId}
PUT    /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}
```

### Checkout

```text
POST /api/checkout/{userId}
```

The checkout request requires an `Idempotency-Key` header.

```text
Idempotency-Key: unique-checkout-key-123
```

### Payments

```text
POST /api/payments/{orderId}?success=true
POST /api/payments/{orderId}?success=false
```

### Orders

```text
GET  /api/orders/{orderId}
POST /api/orders/{orderId}/cancel
```

## Stock Reservation Flow

```text
User adds product to cart
        ↓
Checkout
        ↓
Product stock is locked
        ↓
Stock availability is checked
        ↓
Stock is reserved
        ↓
Order created as PENDING_PAYMENT
        ↓
Mock payment
      /     \
 Success    Failure
   ↓           ↓
CONFIRMED   PAYMENT_FAILED
               ↓
        Stock released
```

If payment is not completed within the reservation period, the order expires and the reserved stock is released automatically.

## Concurrency Protection

Task 01 uses pessimistic database locking during checkout.

The product row is locked before checking and updating stock.

This prevents concurrent checkout requests from reserving the same stock quantity and helps prevent overselling.

Example:

```text
Available stock = 1

User A → Checkout → Stock reserved

User B → Checkout → Stock unavailable → HTTP 409 Conflict
```

## Idempotency

Checkout requests require an `Idempotency-Key`.

If the same key is submitted again, the existing order is returned instead of creating another order.

This prevents duplicate orders caused by repeated checkout requests.

## Environment Variables

```text
DB_USERNAME=postgres
DB_PASSWORD=<your-password>
```

Do not commit actual database credentials to GitHub.

## Run Backend Locally

```bash
cd task-01/backend
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Backend:

```text
http://localhost:8080
```

## Run Frontend Locally

```bash
cd task-01/frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

---

# Task 02 - E-Commerce Checkout & Payment System

## Overview

A mini e-commerce application that allows users to browse and search products, add products to a shopping cart, complete checkout, reserve stock, process mock payments, view order history, and cancel confirmed orders.

The system demonstrates stock reservation, payment failure handling, automatic reservation expiry, and refund simulation.

## Tech Stack

### Backend

* Java 21
* Spring Boot
* Spring Data JPA
* PostgreSQL
* Maven
* REST API

### Frontend

* React
* Vite
* Axios
* JavaScript
* CSS

### Deployment

* AWS EC2
* AWS RDS PostgreSQL
* GitHub

## Implemented Features

* Product CRUD
* Add new products
* Product search
* Product listing
* Product details
* Shopping cart
* Add products to cart
* Update cart quantity
* Remove cart items
* Clear cart
* Checkout
* Stock reservation
* Mock payment gateway
* Payment success handling
* Payment failure handling
* Stock release after payment failure
* Order history
* Order cancellation
* Mock refund handling
* Reservation expiry
* Automatic stock release
* Unique browser-based user ID
* PostgreSQL persistence

## Project Structure

```text
task-02/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── pom.xml
│   └── mvnw.cmd
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Product Management

Products can be added through the frontend.

The product form accepts:

```text
Product Name
Description
Price
Stock Quantity
```

The frontend sends the product to:

```text
POST /api/products
```

The backend stores the product in PostgreSQL.

After successful creation, the product list is refreshed automatically.

## Product Search

Users can search products by name.

```text
GET /api/products/search?name=<search-term>
```

The search uses case-insensitive product-name matching.

## Shopping Cart

Users can:

* Add products
* Increase quantity
* Decrease quantity
* Remove products
* Clear the cart
* View the cart total

Cart endpoints:

```text
POST   /api/cart/{userId}/items
GET    /api/cart/{userId}
PUT    /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}
```

## Checkout Flow

```text
Browse Products
       ↓
Search Product
       ↓
Add to Cart
       ↓
Review Cart
       ↓
Checkout
       ↓
Stock Reserved
       ↓
PENDING_PAYMENT
       ↓
Mock Payment
     /       \
Success     Failure
  ↓            ↓
CONFIRMED   PAYMENT_FAILED
  ↓            ↓
Order       Stock Released
History
```

## Payment Processing

The application uses a mock payment gateway for testing.

### Payment Success

```text
POST /api/payments/{orderId}?success=true
```

The order changes to:

```text
CONFIRMED
```

### Payment Failure

```text
POST /api/payments/{orderId}?success=false
```

The order changes to:

```text
PAYMENT_FAILED
```

The reserved stock is released.

## Order History

Users can view their previous orders.

```text
GET /api/orders/user/{userId}
```

The order history displays:

* Order ID
* Order date
* Total amount
* Order status

## Order Cancellation and Refund

A confirmed order can be cancelled.

```text
POST /api/orders/{orderId}/cancel
```

The system:

1. Cancels the order
2. Releases the purchased stock
3. Simulates a refund

```text
CONFIRMED
    ↓
Cancel Order
    ↓
CANCELLED
    ↓
Stock Restored
    ↓
Refund Simulated
```

## Reservation Expiry

Orders remain in `PENDING_PAYMENT` while waiting for payment.

If payment is not completed within the reservation period, the order expires automatically.

```text
PENDING_PAYMENT
       ↓
Reservation expires
       ↓
EXPIRED
       ↓
Stock released
```

## User Identification

The frontend generates a unique browser-based user ID and stores it in `localStorage`.

```javascript
const USER_ID =
  localStorage.getItem("ecommerceUserId") ||
  `user-${crypto.randomUUID()}`;
```

This allows different browser sessions to operate as different users.

## Backend API

### Products

```text
POST   /api/products
GET    /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?name=<name>
```

### Cart

```text
POST   /api/cart/{userId}/items
GET    /api/cart/{userId}
PUT    /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}/items/{productId}
DELETE /api/cart/{userId}
```

### Checkout

```text
POST /api/checkout/{userId}
```

Required header:

```text
Idempotency-Key: unique-key
```

### Payments

```text
POST /api/payments/{orderId}?success=true
POST /api/payments/{orderId}?success=false
```

### Orders

```text
GET  /api/orders/{orderId}
GET  /api/orders/user/{userId}
POST /api/orders/{orderId}/cancel
```

## Environment Variables

```text
DB_USERNAME=postgres
DB_PASSWORD=<your-password>
```

Actual database passwords are not stored in the repository.

## Run Task 02 Backend Locally

```bash
cd task-02/backend
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend:

```text
http://localhost:8081
```

## Run Task 02 Frontend Locally

```bash
cd task-02/frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

---

# Database

PostgreSQL is used for persistent data storage.

The deployed applications use AWS RDS PostgreSQL.

Database credentials are supplied through environment variables.

Example configuration:

```properties
spring.datasource.url=<database-url>
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD}
```

Hibernate schema management:

```properties
spring.jpa.hibernate.ddl-auto=update
```

---

# Testing

## Task 01

The following scenarios were tested:

* Product creation
* Cart management
* Checkout
* Successful payment
* Failed payment
* Stock release after payment failure
* Reservation expiry
* Automatic stock release
* Order cancellation
* Refund simulation
* Idempotency
* Overselling protection
* HTTP 409 stock conflict handling

### Successful Payment

```text
Checkout
   ↓
Stock reserved
   ↓
Payment success
   ↓
Order CONFIRMED
```

### Failed Payment

```text
Checkout
   ↓
Stock reserved
   ↓
Payment failed
   ↓
Order PAYMENT_FAILED
   ↓
Stock released
```

### Reservation Expiry

```text
PENDING_PAYMENT
       ↓
Reservation timeout
       ↓
EXPIRED
       ↓
Stock released
```

### Cancellation

```text
CONFIRMED
    ↓
Cancel
    ↓
CANCELLED
    ↓
Stock restored
    ↓
Refund simulated
```

### Idempotency

Repeated checkout requests using the same idempotency key do not create duplicate orders.

### Overselling Protection

Pessimistic database locking is used during checkout to protect inventory from concurrent checkout requests.

---

# Task 02 Testing

The following scenarios were tested:

* Product creation
* Product search
* Add to cart
* Cart quantity update
* Remove from cart
* Clear cart
* Checkout
* Stock reservation
* Payment success
* Payment failure
* Stock release after failed payment
* Order history
* Order cancellation
* Refund simulation
* Reservation expiry
* Stock restoration

Example:

```text
Initial stock = 10

Purchase quantity = 2

After checkout:
Stock = 8

After cancellation:
Stock = 10
```

---

# Deployment

The applications are deployed using AWS EC2.

Both backend applications run on the same EC2 instance using different ports.

```text
                 AWS EC2
                   │
        ┌──────────┴──────────┐
        │                     │
 Task 01 Backend         Task 02 Backend
 Port 8080               Port 8081
        │                     │
        └──────────┬──────────┘
                   │
              AWS RDS
             PostgreSQL
```

## Task 01

Frontend:

```text
http://3.80.42.113:5173
```

Backend:

```text
http://3.80.42.113:8080
```

## Task 02

Frontend:

```text
http://3.80.42.113:5174
```

Backend:

```text
http://3.80.42.113:8081
```

---

# Repository

GitHub Repository:

[https://github.com/Arunpragash22/techloom-pos-ecommerce](https://github.com/Arunpragash22/techloom-pos-ecommerce)

## Repository Structure

```text
techloom-pos-ecommerce/
│
├── task-01/
│   ├── backend/
│   └── frontend/
│
├── task-02/
│   ├── backend/
│   └── frontend/
│
└── README.md
```

---

# Security

Sensitive credentials are not stored directly in the source code.

Database credentials are provided through environment variables:

```text
DB_USERNAME
DB_PASSWORD
```

Do not commit:

```text
.env
passwords
private keys
AWS credentials
database credentials
```

---

# Requirements

## Backend

* Java 21
* Maven
* PostgreSQL

## Frontend

* Node.js
* npm

## Deployment

* AWS EC2
* AWS RDS PostgreSQL

---

