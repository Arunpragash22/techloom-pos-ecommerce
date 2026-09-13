package com.techloom.ecommerce.repository;

import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Order> findByStatusAndReservationExpiresAtBefore(
            OrderStatus status,
            LocalDateTime time
    );
}