package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;
import com.example.demo.dtos.UserLocationDto;
import com.example.demo.entities.Product;
import com.example.demo.interfaces.ProductService;
import com.example.demo.repositories.ProductRepository;
import com.example.demo.utils.DistanceCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuthClient authClient;

    private final UserClient userClient;

    // ThreadLocal para almacenar el token de la solicitud actual
    private static final ThreadLocal<String> currentToken = new ThreadLocal<>();

    public ProductServiceImpl(UserClient userClient, ProductRepository productRepository) {
        this.userClient = userClient;
        this.productRepository = productRepository;
    }

    // Método para establecer el token (llamado desde el controlador)
    public static void setCurrentToken(String token) {
        currentToken.set(token);
    }

    // Método para limpiar el token (para evitar fugas de memoria)
    public static void clearCurrentToken() {
        currentToken.remove();
    }

    @Override
    public ProductDto createProduct(CreateProductDto dto, Long ownerId) {
        Product product = new Product();
        product.setOwnerId(ownerId);
        product.setTitle(dto.getTitle());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setAttributes(dto.getAttributes());
        product.setPrice(dto.getPrice());
        product.setImageUrl(dto.getImageUrl()); // Ahora es una lista
        product.setImageId(dto.getImageId());   // Ahora es una lista

        product = productRepository.save(product);
        return mapToDto(product);
    }

    @Override
    public List<ProductDto> getAllProducts(String category, String keyword) {
        List<Product> products;
        if (category != null && keyword != null) {
            products = productRepository.findByCategory(category).stream()
                    .filter(p -> p.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());
        } else if (category != null) {
            products = productRepository.findByCategory(category);
        } else if (keyword != null) {
            products = productRepository.findByKeyword(keyword);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public ProductDto getProductById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));
        return mapToDto(product);
    }

    @Override
    public ProductDto updateProduct(String id, UpdateProductDto dto, Long ownerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You are not authorized to update this product");
        }

        // Actualizar solo los campos que no son null
        if (dto.getTitle() != null) product.setTitle(dto.getTitle());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        if (dto.getAttributes() != null) product.setAttributes(dto.getAttributes());
        if (dto.getPrice() != null) product.setPrice(dto.getPrice());

        // Manejar las listas de imágenes
        if (dto.getImageUrl() != null) {
            product.setImageUrl(dto.getImageUrl()); // Asigna la nueva lista de URLs
        }
        if (dto.getImageId() != null) {
            product.setImageId(dto.getImageId());   // Asigna la nueva lista de IDs
        }

        product = productRepository.save(product);
        return mapToDto(product);
    }

    @Override
    public void deleteProduct(String id, Long ownerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You are not authorized to delete this product");
        }

        productRepository.delete(product);
    }

    @Override
    public void transferProduct(String id, Long fromUserId, Long toUserId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(fromUserId)) {
            throw new IllegalArgumentException("The product does not belong to the specified fromUserId");
        }

        product.setOwnerId(toUserId);
        productRepository.save(product);
    }

    @Override
    public ProductDto getProductsByOwnerAndId(long ownerId, String productId) {
        Product product = productRepository.findByOwnerIdAndId(ownerId, productId);
        if (product != null) {
            return mapToDto(product);
        }
        return null;
    }

    @Override
    public List<ProductDto> findByOwnerId(long ownerId) {
        List<Product> products = productRepository.findByOwnerId(ownerId);
        return products.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<Product> findByKeyword(String keyword) {
        return productRepository.findByKeyword(keyword);
    }

    @Override
    public List<ProductDto> getProductsByLocation(String location) {
        List<Long> userIds = userClient.getUserIdsByLocation(location);
        List<Product> products = productRepository.findByOwnerIdIn(userIds);

        List<ProductDto> dtos = new ArrayList<>();
        for (Product product : products) {
            dtos.add(mapToDto(product));
        }
        return dtos;
    }

    @Override
    public List<ProductDto> getProductsByCoordinates(Double latitude, Double longitude, Double radius, String category, String keyword) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }

        // Obtener el token del ThreadLocal
        String token = currentToken.get();
        if (token == null) {
            throw new IllegalStateException("No token available in the current context");
        }

        // Obtener todos los usuarios con ubicación desde el microservicio de Usuarios
        List<UserLocationDto> users = userClient.getUsersWithLocation(token);

        // Filtrar usuarios dentro del radio
        List<Long> userIdsInRange = users.stream()
                .filter(user -> user.getLatitude() != null && user.getLongitude() != null) // Asegurarse de que tengan ubicación
                .filter(user -> {
                    double distance = DistanceCalculator.calculateDistance(
                            latitude, longitude, user.getLatitude(), user.getLongitude());
                    return distance <= radius; // Filtrar por distancia
                })
                .map(UserLocationDto::getId)
                .collect(Collectors.toList());

        // Obtener productos de esos usuarios
        List<Product> products = productRepository.findByOwnerIdIn(userIdsInRange);

        // Aplicar filtros adicionales (categoría y palabra clave)
        if (category != null && !category.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }
        if (keyword != null && !keyword.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getTitle() != null && p.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());
        }

        // Convertir a DTOs
        return products.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto mapToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setOwnerId(product.getOwnerId());
        dto.setTitle(product.getTitle());
        dto.setImageUrl(product.getImageUrl());
        dto.setDescription(product.getDescription());
        dto.setCategory(product.getCategory());
        dto.setStatus(product.getStatus());
        dto.setAttributes(product.getAttributes());
        dto.setPrice(product.getPrice());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setImageId(product.getImageId());

        // Obtener la ubicación del usuario propietario
        String token = currentToken.get();
        if (token != null) {
            List<UserLocationDto> users = userClient.getUsersWithLocation(token);
            UserLocationDto ownerLocation = users.stream()
                    .filter(user -> user.getId().equals(product.getOwnerId()))
                    .findFirst()
                    .orElse(null);

            if (ownerLocation != null) {
                dto.setLatitude(ownerLocation.getLatitude());
                dto.setLongitude(ownerLocation.getLongitude());
                dto.setOwnerLocation(ownerLocation.getLocationName() != null ? ownerLocation.getLocationName() : "Ubicación no disponible");
                dto.setOwnerUsername(ownerLocation.getUsername() != null ? ownerLocation.getUsername() : "Desconocido");
                dto.setOwnerRating(ownerLocation.getRating() != null ? ownerLocation.getRating() : 0.0);
                dto.setOwnerReviewCount(ownerLocation.getReviewCount() != null ? ownerLocation.getReviewCount() : 0);
            } else {
                dto.setLatitude(null);
                dto.setLongitude(null);
                dto.setOwnerLocation("Ubicación no disponible");
                dto.setOwnerUsername("Desconocido");
                dto.setOwnerRating(0.0);
                dto.setOwnerReviewCount(0);
            }
        } else {
            dto.setLatitude(null);
            dto.setLongitude(null);
            dto.setOwnerLocation("Ubicación no disponible");
            dto.setOwnerUsername("Desconocido");
            dto.setOwnerRating(0.0);
            dto.setOwnerReviewCount(0);
        }

        return dto;
    }
}