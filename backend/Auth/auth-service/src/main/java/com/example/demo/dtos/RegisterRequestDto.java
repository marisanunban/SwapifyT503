package com.example.demo.dtos;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String email;
    private String password;

    public RegisterRequestDto(String email, String password) {
        this.email = email;
        this.password = password;
    }
}
