package com.example.DTOs;

import com.example.entities.Users;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;

public class UsersDTO {

    private Long id; // Ahora es un número autoincremental

    private String email;

    private String password;

    private Users.Role role = Users.Role.USER;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public void setPassword(String rawPassword) {
        this.password = new BCryptPasswordEncoder().encode(rawPassword);
    }

    public enum Role {
        USER, ADMIN
    }
}
