package com.techloom.pos_backend.service;

import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.entity.OrderItem;
import com.techloom.pos_backend.entity.OrderStatus;
import com.techloom.pos_backend.entity.Product;
import com.techloom.pos_backend.entity.Payment;
import com.techloom.pos_backend.entity.PaymentStatus;
import com.techloom.pos_backend.repository.OrderRepository;
import com.techloom.pos_backend.repository.PaymentRepository;
import com.techloom.pos_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ProductRepository productRepository) {

        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Order cancelOrder(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new RuntimeException(
                    "Only confirmed orders can be cancelled");
        }

        // Return stock
        for (OrderItem item : order.getItems()) {

            Product product = item.getProduct();

            product.setStockQuantity(
                    product.getStockQuantity() + item.getQuantity()
            );

            productRepository.save(product);
        }

        // Mock refund
        Payment payment = paymentRepository
                .findByOrderId(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        order.setStatus(OrderStatus.CANCELLED);

        return orderRepository.save(order);
    }
}