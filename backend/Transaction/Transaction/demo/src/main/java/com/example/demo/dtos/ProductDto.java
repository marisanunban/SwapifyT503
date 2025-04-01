package com.example.demo.dtos;


import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ProductDto {

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