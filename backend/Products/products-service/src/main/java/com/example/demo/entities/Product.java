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

    private List<String> imageUrl; // Cambiado de String a List<String>

    private List<String> imageId;  // Cambiado de String a List<String>

    private Map<String, String> attributes;

    private Double price;

    private LocalDateTime createdAt;

    public Product() {
        this.createdAt = LocalDateTime.now();
        this.status = "available";
    }
}