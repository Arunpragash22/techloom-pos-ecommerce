# Techloom.ai Software Engineer Intern Assessment

This repository contains the two tasks completed for the Techloom.ai Software Engineer Intern practical assessment.

## Tasks

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
- Git & GitHub

## Implemented Features

- Product CRUD
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

## Project Structure

```text
task-01/
└── backend/
    ├── src/
    │   └── main/
    │       ├── java/
    │       └── resources/
    ├── pom.xml
    └── mvnw.cmd