package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.Product;
import com.example.demo.interfaces.ProductService;
import com.example.demo.repositories.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/products")

public class ProductController {
    @Autowired
    private ProductRepository productRepository;
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

    @PostMapping("/{id}/transfer")
    public ResponseEntity<Void> transferProduct(
            @PathVariable("id") String id,
            @RequestParam("fromUserId") Long fromUserId,
            @RequestParam("toUserId") Long toUserId,
            @RequestHeader("Authorization") String token) {
        try {
            System.out.println("Iniciando transferProduct - ID del producto: " + id);
            System.out.println("Parámetros recibidos - fromUserId: " + fromUserId + ", toUserId: " + toUserId);
            System.out.println("Token recibido: " + token);

            Long requesterId = getOwnerIdFromToken(token);
            System.out.println("ID del usuario autenticado (requesterId): " + requesterId);

            if (!requesterId.equals(fromUserId)) {
                System.out.println("403 Forbidden: El requesterId (" + requesterId + ") no coincide con fromUserId (" + fromUserId + ")");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            System.out.println("Usuario autorizado. Procediendo con la transferencia...");
            productService.transferProduct(id, fromUserId, toUserId);
            System.out.println("Transferencia completada exitosamente para el producto: " + id);

            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            System.out.println("404 Not Found: Producto no encontrado - " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            System.out.println("403 Forbidden: Argumento inválido - " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            System.out.println("ERROR en transferProduct: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable String id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

//Por ahora este nos da igual
    public ProductDto getProductsByOwnerAndId(long ownerId, String productId) {
        Product product = productRepository.findByOwnerIdAndId(ownerId, productId);
        if (product != null){
            ProductDto dto = productService.mapToDto(product);
            return dto;
        }
        return null;
    }
@GetMapping("/ownerId/{ownerId}")
    public List<ProductDto> getProductByOwnerId(@PathVariable long ownerId) {
        return productService.findByOwnerId(ownerId);
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

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchByKeyword(@RequestParam String keyword) {
        int minimumLength = 4;
        if (keyword.length() < minimumLength) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        List<Product> products = productService.findByKeyword(keyword);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @GetMapping("/by-location/{location}")
    public ResponseEntity<List<ProductDto>> getProductsByLocation(@PathVariable String location) {
        List<ProductDto> products = productService.getProductsByLocation(location);
        return ResponseEntity.ok(products);
    }


    private Long getOwnerIdFromToken(String token) {
        String bearerToken = token.replace("Bearer ", "");
        UserInfoDto userInfo = authClient.validateUserToken(bearerToken, null)
                .block(); // Nota: .block() está bien para pruebas, pero considera alternativas asíncronas en producción
        if (userInfo == null || userInfo.getId() == null) {
            throw new IllegalArgumentException("Invalid token or user not found");
        }
        return userInfo.getId();
    }
}