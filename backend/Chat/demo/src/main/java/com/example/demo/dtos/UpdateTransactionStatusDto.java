package com.example.demo.dtos;

public class UpdateTransactionStatusDto {
    private String status;
    private String productRequestedId;  // Necesario cuando el comprador ofrece un producto

    public void setStatus(String status) {
        this.status = status;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public String getStatus() {
        return status;
    }
}