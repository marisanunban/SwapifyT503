package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetTokenDTO {
    private Long id;
    private String token;
    private LocalDateTime expiresAt;
    private Long userId; // Referencia al usuario
}
