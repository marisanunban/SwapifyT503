package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.interfaces.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private AuthClient authClient;

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody CreateProductDto dto,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        ProductDto product = productService.createProduct(dto, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        List<ProductDto> products = productService.getAllProducts(category, keyword);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable String id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable String id,
            @RequestBody UpdateProductDto dto,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        ProductDto updatedProduct = productService.updateProduct(id, dto, ownerId);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        productService.deleteProduct(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    private Long getOwnerIdFromToken(String token) {
        String bearerToken = token.replace("Bearer ", "");
        UserInfoDto userInfo = authClient.validateUserToken(bearerToken, null)
                .block();
        if (userInfo == null || userInfo.getId() == null) {
            throw new IllegalArgumentException("Invalid token or user not found");
        }
        return userInfo.getId();
    }
}