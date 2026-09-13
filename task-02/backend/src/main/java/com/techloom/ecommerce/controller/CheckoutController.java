package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.service.CheckoutService;
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
            @PathVariable String userId) {

        return ResponseEntity.ok(
                checkoutService.checkout(userId)
        );
    }
}