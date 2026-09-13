package com.techloom.pos_backend.service;

import com.techloom.pos_backend.entity.Cart;
import com.techloom.pos_backend.entity.CartItem;
import com.techloom.pos_backend.entity.Order;
import com.techloom.pos_backend.entity.OrderItem;
import com.techloom.pos_backend.entity.OrderStatus;
import com.techloom.pos_backend.entity.Product;
import com.techloom.pos_backend.repository.CartItemRepository;
import com.techloom.pos_backend.repository.CartRepository;
import com.techloom.pos_backend.repository.OrderItemRepository;
import com.techloom.pos_backend.repository.OrderRepository;
import com.techloom.pos_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class CheckoutService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    public CheckoutService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Order checkout(String userId, String idempotencyKey) {

        // Validate idempotency key
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new RuntimeException("Idempotency-Key is required");
        }

        // Prevent duplicate checkout
        Order existingOrder = orderRepository
                .findByIdempotencyKey(idempotencyKey)
                .orElse(null);

        if (existingOrder != null) {
            return existingOrder;
        }

        // Get user's cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Create order
        Order order = new Order();

        order.setUserId(userId);
        order.setIdempotencyKey(idempotencyKey);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setCreatedAt(LocalDateTime.now());
        order.setReservationExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );

        BigDecimal total = BigDecimal.ZERO;

        // Process cart items
        for (CartItem cartItem : cart.getItems()) {

            /*
             * IMPORTANT:
             * Lock the product row before checking/updating stock.
             * This prevents concurrent checkouts from overselling.
             */
            Product product = productRepository
                    .findByIdWithLock(cartItem.getProduct().getId())
                    .orElseThrow(() ->
                            new RuntimeException("Product not found"));

            int requestedQuantity = cartItem.getQuantity();

            // Check product status
            if (!product.getActive()) {
                throw new RuntimeException(
                        "Product is not active: "
                                + product.getName());
            }

            // Check available stock
            if (product.getStockQuantity() < requestedQuantity) {
                throw new RuntimeException(
                        "Not enough stock for product: "
                                + product.getName());
            }

            // Reserve stock
            product.setStockQuantity(
                    product.getStockQuantity() - requestedQuantity
            );

            productRepository.save(product);

            // Create order item
            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(requestedQuantity);
            orderItem.setUnitPrice(product.getPrice());

            // Calculate subtotal
            BigDecimal subtotal = product.getPrice()
                    .multiply(
                            BigDecimal.valueOf(requestedQuantity)
                    );

            total = total.add(subtotal);

            order.getItems().add(orderItem);
        }

        // Set total amount
        order.setTotalAmount(total);

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Save order items
        orderItemRepository.saveAll(order.getItems());

        // Clear cart after successful checkout
        for (CartItem item : cart.getItems()) {
            cartItemRepository.delete(item);
        }

        cart.getItems().clear();
        cartRepository.save(cart);

        return savedOrder;
    }
}