package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.entity.Payment;
import com.techloom.ecommerce.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{orderId}")
    public ResponseEntity<Payment> processPayment(
            @PathVariable Long orderId,
            @RequestParam boolean success) {

        return ResponseEntity.ok(
                paymentService.processPayment(orderId, success)
        );
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Payment> getPayment(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                paymentService.getPayment(orderId)
        );
    }
}