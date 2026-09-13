package com.techloom.pos_backend.repository;

import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndUserId(Long id, String userId);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByStatusAndReservationExpiresAtBefore(
            OrderStatus status,
            LocalDateTime time
    );
}