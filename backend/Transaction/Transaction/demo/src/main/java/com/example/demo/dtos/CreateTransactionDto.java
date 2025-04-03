package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreateTransactionDto {
    private String sellerEmail; // Cambiamos de sellerId a sellerEmail

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public String getSellerEmail() {
        return sellerEmail;
    }

    private String productRequestedId;
    private String productOfferedId;
    private Integer creditsOffered;
}