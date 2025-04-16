package com.example.demo.dtos;

import lombok.Data;

@Data
public class TransactionDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private String sellerEmail; // Nuevo campo
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;
    private String status;
    private String createdAt;

    // Getters y setters existentes
    public void setId(Long id) {
        this.id = id;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getId() {
        return id;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public Long getSellerId() {
        return sellerId;
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

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    // Getter y setter para el nuevo campo
    public String getSellerEmail() {
        return sellerEmail;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }

    // Constructor actualizado
    public TransactionDto(Long id, Long buyerId, Long sellerId, String sellerEmail,
                          String productRequestedId, String productOfferedId,
                          Integer creditsOffered, String status, String createdAt) {
        this.id = id;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.sellerEmail = sellerEmail;
        this.productRequestedId = productRequestedId;
        this.productOfferedId = productOfferedId;
        this.creditsOffered = creditsOffered;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Constructor por defecto
    public TransactionDto() {
    }
}