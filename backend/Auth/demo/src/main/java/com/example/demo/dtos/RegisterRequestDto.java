package com.example.demo.dtos;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String email;
    private String password;
}
