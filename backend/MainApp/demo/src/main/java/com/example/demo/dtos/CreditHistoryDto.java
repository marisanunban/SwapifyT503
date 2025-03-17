package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CreditHistoryDto {
    private int amount;
    private String reason;
    private LocalDateTime timestamp;
}