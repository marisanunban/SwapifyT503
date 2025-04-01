package com.example.demo.dtos;

import lombok.Data;

@Data
public class TransactionDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;
    private String status;
    private String createdAt;

    // Constructor explícito con todos los argumentos
    public TransactionDto(Long id, Long buyerId, Long sellerId, String productRequestedId,
                          String productOfferedId, Integer creditsOffered, String status, String createdAt) {
        this.id = id;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.productRequestedId = productRequestedId;
        this.productOfferedId = productOfferedId;
        this.creditsOffered = creditsOffered;
        this.status = status;
        this.createdAt = createdAt;
    }
}