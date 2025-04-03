package com.example.demo.dtos;


import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ProductDto {
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void setAttributes(Map<String, String> attributes) {
        this.attributes = attributes;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Double getPrice() {
        return price;
    }

    public Map<String, String> getAttributes() {
        return attributes;
    }

    public String getStatus() {
        return status;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getTitle() {
        return title;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    private String id;

    private Long ownerId; // Cambiado de UUID a Long

    private String title;

    private String description;

    private String category;

    private String status;

    private Map<String, String> attributes;

    private Double price;

    private LocalDateTime createdAt;
}