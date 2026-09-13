package com.techloom.ecommerce.service;

import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderItem;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.repository.ProductRepository;
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
                orderRepository
                        .findByStatusAndReservationExpiresAtBefore(
                                OrderStatus.PENDING_PAYMENT,
                                now
                        );

        for (Order order : expiredOrders) {

            for (OrderItem item : order.getItems()) {

                Product product = item.getProduct();

                product.setStockQuantity(
                        product.getStockQuantity()
                                + item.getQuantity()
                );

                productRepository.save(product);
            }

            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);
        }
    }
}