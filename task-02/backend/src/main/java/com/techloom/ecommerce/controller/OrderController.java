package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public OrderController(
            OrderRepository orderRepository,
            OrderService orderService) {

        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(
            @PathVariable Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Order not found"));

        return ResponseEntity.ok(order);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrderHistory(
            @PathVariable String userId) {

        return ResponseEntity.ok(
                orderRepository
                        .findByUserIdOrderByCreatedAtDesc(userId)
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.cancelOrder(id)
        );
    }
}