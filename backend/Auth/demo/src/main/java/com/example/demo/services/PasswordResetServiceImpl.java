package com.example.demo.services;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.dtos.ResetPasswordResponseDto;
import com.example.demo.entities.PasswordResetToken;
import com.example.demo.entities.Users;
import com.example.demo.exceptions.UserNotFoundException;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl {

    private final UserService userService;
    private final PasswordResetTokenRepository tokenRepository; // Cambio a repositorio
    private final EmailService emailService;


    public ResetPasswordResponseDto requestPasswordReset(ResetPasswordRequestDto requestDto) {
        Users user = userService.findByEmail(requestDto.getEmail());
        if (user == null) {
            throw new UserNotFoundException("Usuario no encontrado para el email: " + requestDto.getEmail());
        }

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1); // Cambio a LocalDateTime

        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setUser(user);
        tokenEntity.setToken(resetToken);
        tokenEntity.setExpiresAt(expiresAt);
        tokenRepository.save(tokenEntity); // Uso el repositorio directamente

        emailService.sendResetPasswordEmail(requestDto.getEmail(), resetToken);

        return new ResetPasswordResponseDto("Correo enviado");
    }

    @Override
    public void confirmPasswordReset(ConfirmResetRequestDto requestDto) {
        // Implementación pendiente si la necesitas
    }
}