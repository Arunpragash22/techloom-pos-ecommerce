package com.techloom.pos_backend.service;

import com.techloom.pos_backend.entity.Cart;
import com.techloom.pos_backend.entity.CartItem;
import com.techloom.pos_backend.entity.Product;
import com.techloom.pos_backend.repository.CartItemRepository;
import com.techloom.pos_backend.repository.CartRepository;
import com.techloom.pos_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    // Get existing cart or create a new cart
    public Cart getOrCreateCart(String userId) {

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUserId(userId);
                    return cartRepository.save(cart);
                });
    }

    // Add product to cart
    @Transactional
    public Cart addToCart(
            String userId,
            Long productId,
            Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found with id: " + productId));

        if (!product.getActive()) {
            throw new RuntimeException("Product is not active");
        }

        if (quantity > product.getStockQuantity()) {
            throw new RuntimeException("Not enough stock available");
        }

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElse(null);

        if (cartItem != null) {

            int newQuantity = cartItem.getQuantity() + quantity;

            if (newQuantity > product.getStockQuantity()) {
                throw new RuntimeException("Not enough stock available");
            }

            cartItem.setQuantity(newQuantity);
            cartItemRepository.save(cartItem);

        } else {

            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cart.getItems().add(cartItem);

            cartItemRepository.save(cartItem);
        }

        return getOrCreateCart(userId);
    }

    // Get cart
    public Cart getCart(String userId) {

        return getOrCreateCart(userId);
    }

    // Update cart item quantity
    @Transactional
    public Cart updateQuantity(
            String userId,
            Long productId,
            Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found in cart"));

        Product product = cartItem.getProduct();

        if (quantity > product.getStockQuantity()) {
            throw new RuntimeException("Not enough stock available");
        }

        cartItem.setQuantity(quantity);

        cartItemRepository.save(cartItem);

        return getOrCreateCart(userId);
    }

    // Remove item from cart
    @Transactional
    public Cart removeFromCart(
            String userId,
            Long productId) {

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found in cart"));

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        return getOrCreateCart(userId);
    }

    // Clear entire cart
    @Transactional
    public void clearCart(String userId) {

        Cart cart = getOrCreateCart(userId);

        for (CartItem item : cart.getItems()) {
            cartItemRepository.delete(item);
        }

        cart.getItems().clear();
        cartRepository.save(cart);
    }
}