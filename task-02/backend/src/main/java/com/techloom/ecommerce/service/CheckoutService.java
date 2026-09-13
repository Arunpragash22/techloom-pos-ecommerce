package com.techloom.ecommerce.service;

import com.techloom.ecommerce.entity.Cart;
import com.techloom.ecommerce.entity.CartItem;
import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderItem;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.CartItemRepository;
import com.techloom.ecommerce.repository.CartRepository;
import com.techloom.ecommerce.repository.OrderItemRepository;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.repository.ProductRepository;

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
    public Order checkout(String userId) {

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        Order order = new Order();

        order.setUserId(userId);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setCreatedAt(LocalDateTime.now());
        order.setReservationExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {

            Product product = productRepository
            .findByIdWithLock(cartItem.getProduct().getId())
            .orElseThrow(() ->
                    new RuntimeException("Product not found"));

            if (!product.getActive()) {
                throw new RuntimeException(
                        "Product is not available: "
                                + product.getName());
            }

            int quantity = cartItem.getQuantity();

            if (product.getStockQuantity() < quantity) {
                throw new RuntimeException(
                        "Not enough stock for product: "
                                + product.getName());
            }

            // Reserve stock
            product.setStockQuantity(
                    product.getStockQuantity() - quantity
            );

            productRepository.save(product);

            // Create order item
            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(product.getPrice());

            BigDecimal subtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(quantity));

            total = total.add(subtotal);

            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);

        orderItemRepository.saveAll(order.getItems());

        // Clear cart after checkout
        for (CartItem item : cart.getItems()) {
            cartItemRepository.delete(item);
        }

        cart.getItems().clear();

        cartRepository.save(cart);

        return savedOrder;
    }
}