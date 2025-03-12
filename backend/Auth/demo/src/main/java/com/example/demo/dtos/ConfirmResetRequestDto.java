package com.example.demo.dtos;

import lombok.Data;

@Data
public class ConfirmResetRequestDto {
    private String token;
    private String newPassword;
}