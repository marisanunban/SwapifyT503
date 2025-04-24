package com.example.demo.dtos;


import lombok.Data;

@Data
public class LoginRequestDto {
    private String useremail;
    private String password;

    public LoginRequestDto(String useremail, String password) {
        this.useremail = useremail;
        this.password = password;
    }
}
