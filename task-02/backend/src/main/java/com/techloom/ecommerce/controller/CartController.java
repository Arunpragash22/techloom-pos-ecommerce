package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.entity.Cart;
import com.techloom.ecommerce.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/{userId}/items")
    public ResponseEntity<Cart> addToCart(
            @PathVariable String userId,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {

        return ResponseEntity.ok(
                cartService.addToCart(
                        userId,
                        productId,
                        quantity
                )
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCart(
            @PathVariable String userId) {

        return ResponseEntity.ok(
                cartService.getCart(userId)
        );
    }

    @PutMapping("/{userId}/items/{productId}")
    public ResponseEntity<Cart> updateQuantity(
            @PathVariable String userId,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {

        return ResponseEntity.ok(
                cartService.updateQuantity(
                        userId,
                        productId,
                        quantity
                )
        );
    }

    @DeleteMapping("/{userId}/items/{productId}")
    public ResponseEntity<Cart> removeFromCart(
            @PathVariable String userId,
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                cartService.removeFromCart(
                        userId,
                        productId
                )
        );
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Cart> clearCart(
            @PathVariable String userId) {

        return ResponseEntity.ok(
                cartService.clearCart(userId)
        );
    }
}