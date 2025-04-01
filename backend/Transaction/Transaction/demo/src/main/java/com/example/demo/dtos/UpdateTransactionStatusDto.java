package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateTransactionStatusDto {
    private String status; // "accepted" or "rejected"
}
