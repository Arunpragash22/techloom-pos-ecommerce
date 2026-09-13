package com.techloom.pos_backend.controller;

import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.service.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@CrossOrigin(origins = "*")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Order> checkout(
            @PathVariable String userId,
            @RequestHeader("Idempotency-Key") String idempotencyKey) {

        return ResponseEntity.ok(
                checkoutService.checkout(userId, idempotencyKey)
        );
    }
}