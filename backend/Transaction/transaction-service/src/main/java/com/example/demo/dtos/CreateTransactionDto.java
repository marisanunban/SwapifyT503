package com.example.demo.dtos;

public class CreateTransactionDto {
    private String productOfferedId;  // ID del producto que el vendedor ofrece
    private String productRequestedId;  // ID del producto que el comprador solicita
    private Integer creditsOffered;  // Créditos ofrecidos por el vendedor (opcional)
    private Integer creditsRequested;  // Créditos solicitados por el comprador (opcional)
    private Long sellerId;  // ID del vendedor
    private Long buyerId;  // ID del comprador

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public Integer getCreditsRequested() {
        return creditsRequested;
    }

    public void setCreditsRequested(Integer creditsRequested) {
        this.creditsRequested = creditsRequested;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }
}