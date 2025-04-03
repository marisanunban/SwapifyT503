package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateTransactionStatusDto {
    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    private String status; // "accepted" or "rejected"
}
