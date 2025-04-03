package com.example.demo.interfaces;

import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;

import java.util.List;

public interface ProductService {

    ProductDto createProduct(CreateProductDto dto, Long ownerId);

    List<ProductDto> getAllProducts(String category, String keyword);

    ProductDto getProductById(String id);

    ProductDto updateProduct(String id, UpdateProductDto dto, Long ownerId);

    void deleteProduct(String id, Long ownerId);

    void transferProduct(String id, Long fromUserId, Long toUserId);
}