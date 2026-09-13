package com.techloom.pos_backend.service;

import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.entity.OrderItem;
import com.techloom.pos_backend.entity.OrderStatus;
import com.techloom.pos_backend.entity.Payment;
import com.techloom.pos_backend.entity.PaymentStatus;
import com.techloom.pos_backend.entity.Product;
import com.techloom.pos_backend.repository.OrderRepository;
import com.techloom.pos_backend.repository.PaymentRepository;
import com.techloom.pos_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            ProductRepository productRepository) {

        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Payment processPayment(Long orderId, boolean success) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new RuntimeException(
                    "Payment cannot be processed for order status: "
                            + order.getStatus());
        }

        if (paymentRepository.findByOrderId(orderId).isPresent()) {
            throw new RuntimeException(
                    "Payment already processed for this order");
        }

        Payment payment = new Payment();

        payment.setOrderId(orderId);
        payment.setAmount(order.getTotalAmount());
        payment.setCreatedAt(LocalDateTime.now());

        if (success) {

            payment.setStatus(PaymentStatus.SUCCESS);
            order.setStatus(OrderStatus.CONFIRMED);

        } else {

            payment.setStatus(PaymentStatus.FAILED);

            // Release reserved stock
            for (OrderItem item : order.getItems()) {

                Product product = item.getProduct();

                product.setStockQuantity(
                        product.getStockQuantity() + item.getQuantity()
                );

                productRepository.save(product);
            }

            order.setStatus(OrderStatus.PAYMENT_FAILED);
        }

        orderRepository.save(order);

        return paymentRepository.save(payment);
    }
}