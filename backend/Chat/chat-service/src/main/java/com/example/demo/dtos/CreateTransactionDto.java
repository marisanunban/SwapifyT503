package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreateTransactionDto {
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;
    private Integer creditsRequested;
    private Long sellerId;  // ID del vendedor
    private Long buyerId;  // ID del comprador

    // Getters y setters
    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public void setCreditsRequested(Integer creditsRequested) {
        this.creditsRequested = creditsRequested;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public Integer getCreditsRequested() {
        return creditsRequested;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    // Constructor
    public CreateTransactionDto(String productOfferedId, String productRequestedId,
                                Integer creditsOffered, Integer creditsRequested,
                                Long sellerId, Long buyerId) {
        this.productOfferedId = productOfferedId;
        this.productRequestedId = productRequestedId;
        this.creditsOffered = creditsOffered;
        this.creditsRequested = creditsRequested;
        this.sellerId = sellerId;
        this.buyerId = buyerId;
    }

    // Constructor por defecto
    public CreateTransactionDto() {
    }
}