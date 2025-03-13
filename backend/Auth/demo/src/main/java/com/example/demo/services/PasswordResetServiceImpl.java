package com.example.demo.services;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.entities.PasswordResetToken;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.EmailService;
import com.example.demo.interfaces.PasswordResetService;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.PasswordResetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    @Autowired
    private UserService userService;
    @Autowired
    private PasswordResetRepository tokenRepository;
    @Autowired
    private EmailService emailService;

    @Override
    public MessageDto requestPasswordReset(ResetPasswordRequestDto requestDto) {
        Users user = userService.findByEmail(requestDto.getEmail());
        // EntityNotFoundException se lanza desde UserServiceImpl

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setUser(user);
        tokenEntity.setToken(resetToken);
        tokenEntity.setExpiresAt(expiresAt);
        tokenRepository.save(tokenEntity);

        emailService.sendResetPasswordEmail(requestDto.getEmail(), resetToken);

        return new MessageDto("Correo enviado");
    }

    @Override
    public void confirmPasswordReset(ConfirmResetRequestDto requestDto) {
        // Implementación pendiente
    }
}