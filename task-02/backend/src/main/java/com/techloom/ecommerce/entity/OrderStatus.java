package com.techloom.ecommerce.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    CONFIRMED,
    PAYMENT_FAILED,
    EXPIRED,
    CANCELLED,
    REFUNDED
}