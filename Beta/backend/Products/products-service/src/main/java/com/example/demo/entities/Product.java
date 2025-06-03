package com.example.demo.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "products")
@Data
public class Product {
    @Id
    private String id;
    private Long ownerId;
    private String title;
    private String description;
    private String category;
    private String status;
    private List<String> imageUrl;
    private List<String> imageId;
    private Map<String, String> attributes;
    private Double price;
    private LocalDateTime createdAt;
    private transient boolean isFavorite; // Añadido, no se persiste
    private transient long favoriteCount; // Añadido, no se persiste

    public Product() {
        this.createdAt = LocalDateTime.now();
        this.status = "available";
    }
}