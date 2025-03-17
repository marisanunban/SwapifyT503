package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreditRequestDto {
    private int amount;
    private String reason;
}