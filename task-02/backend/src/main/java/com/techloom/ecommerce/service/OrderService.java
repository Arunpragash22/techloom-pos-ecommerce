package com.techloom.ecommerce.service;

import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderItem;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.entity.Payment;
import com.techloom.ecommerce.entity.PaymentStatus;
import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.repository.PaymentRepository;
import com.techloom.ecommerce.repository.ProductRepository;
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
                    product.getStockQuantity()
                            + item.getQuantity()
            );

            productRepository.save(product);
        }

        // Refund payment
        Payment payment = paymentRepository
                .findByOrderId(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
        }

        order.setStatus(OrderStatus.CANCELLED);

        return orderRepository.save(order);
    }
}