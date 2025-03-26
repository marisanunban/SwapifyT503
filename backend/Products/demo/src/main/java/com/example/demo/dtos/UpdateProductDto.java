package com.example.demo.dtos;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateProductDto {

    private String title;

    private String description;

    private Map<String, String> attributes;

    private Double price;
}