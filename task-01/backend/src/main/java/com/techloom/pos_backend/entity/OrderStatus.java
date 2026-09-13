package com.techloom.pos_backend.entity;

public enum OrderStatus {

    PENDING_PAYMENT,
    CONFIRMED,
    PAYMENT_FAILED,
    EXPIRED,
    CANCELLED
}