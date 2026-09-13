package com.techloom.pos_backend.service;

import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.entity.OrderItem;
import com.techloom.pos_backend.entity.OrderStatus;
import com.techloom.pos_backend.entity.Product;
import com.techloom.pos_backend.repository.OrderRepository;
import com.techloom.pos_backend.repository.ProductRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public ReservationService(
            OrderRepository orderRepository,
            ProductRepository productRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void expireReservations() {

        LocalDateTime now = LocalDateTime.now();

        List<Order> expiredOrders =
                orderRepository.findByStatusAndReservationExpiresAtBefore(
                        OrderStatus.PENDING_PAYMENT,
                        now
                );

        for (Order order : expiredOrders) {

            // Release reserved stock
            for (OrderItem item : order.getItems()) {

                Product product = item.getProduct();

                product.setStockQuantity(
                        product.getStockQuantity() + item.getQuantity()
                );

                productRepository.save(product);
            }

            // Mark order as expired
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);
        }
    }
}