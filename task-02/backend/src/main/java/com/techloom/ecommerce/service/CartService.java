package com.techloom.ecommerce.service;

import com.techloom.ecommerce.entity.Cart;
import com.techloom.ecommerce.entity.CartItem;
import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.CartItemRepository;
import com.techloom.ecommerce.repository.CartRepository;
import com.techloom.ecommerce.repository.ProductRepository;
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

    private Cart getOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUserId(userId);
                    return cartRepository.save(cart);
                });
    }

    @Transactional
    public Cart addToCart(
            String userId,
            Long productId,
            Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException(
                    "Quantity must be greater than zero");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        if (!product.getActive()) {
            throw new RuntimeException(
                    "Product is not available");
        }

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(
                        cart.getId(),
                        productId)
                .orElse(null);

        int newQuantity = quantity;

        if (cartItem != null) {
            newQuantity = cartItem.getQuantity() + quantity;
        }

        if (product.getStockQuantity() < newQuantity) {
            throw new RuntimeException(
                    "Not enough stock for product: "
                            + product.getName());
        }

        if (cartItem == null) {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
        }

        cartItem.setQuantity(newQuantity);
        cartItemRepository.save(cartItem);

        if (!cart.getItems().contains(cartItem)) {
            cart.getItems().add(cartItem);
        }

        return cart;
    }

    public Cart getCart(String userId) {
        return getOrCreateCart(userId);
    }

    @Transactional
    public Cart updateQuantity(
            String userId,
            Long productId,
            Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException(
                    "Quantity must be greater than zero");
        }

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(
                        cart.getId(),
                        productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found in cart"));

        Product product = cartItem.getProduct();

        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException(
                    "Not enough stock for product: "
                            + product.getName());
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        return cart;
    }

    @Transactional
    public Cart removeFromCart(
            String userId,
            Long productId) {

        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(
                        cart.getId(),
                        productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found in cart"));

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        return cart;
    }

    @Transactional
    public Cart clearCart(String userId) {

        Cart cart = getOrCreateCart(userId);

        cart.getItems().clear();
        cartRepository.save(cart);

        return cart;
    }
}