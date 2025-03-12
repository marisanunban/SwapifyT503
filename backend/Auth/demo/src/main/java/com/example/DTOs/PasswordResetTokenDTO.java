package com.example.DTOs;

import com.example.entities.Users;
import jakarta.persistence.*;

import java.time.LocalDateTime;

public class PasswordResetTokenDTO {

    private Long id; // Ahora es un número autoincremental

    private String token;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    private LocalDateTime expiresAt;

    private Users user;
}
