package com.example.demo.dtos;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String useremail;
    private String password;

    public RegisterRequestDto(String useremail, String password) {
        this.useremail = useremail;
        this.password = password;
    }
}
