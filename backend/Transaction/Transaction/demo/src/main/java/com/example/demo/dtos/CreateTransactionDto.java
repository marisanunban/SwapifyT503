package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreateTransactionDto {
    private Long sellerId;
    private String productRequestedId;
    private String productOfferedId; // Optional
    private Integer creditsOffered; // Optional (default 0)
}
