package com.example.demo.dtos;

public class UpdateTransactionStatusDto {
    private String status;
    private String productRequestedId;  // Necesario cuando el comprador ofrece un producto
    private Long conversationId; // Campo para recibir el conversationId

    // Getters y Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
}