package com.example.DTOs;

import com.example.entities.Users;
import jakarta.persistence.*;

import java.time.LocalDateTime;

public class PasswordResetTokenDTO {

    private Long id; // Ahora es un número autoincremental

    private String token;

    private LocalDateTime expiresAt;

    private Users user;
}
