package com.example.demo.dtos;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String email; // Cambiado de username a email
    private int credits;

    public UserDto() {
    }

    public UserDto(Long id, String email, int credits) {
        this.id = id;
        this.email = email;
        this.credits = credits;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }
}