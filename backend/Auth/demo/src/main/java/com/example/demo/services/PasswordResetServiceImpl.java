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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    @Autowired
    private PasswordEncoder passwordEncoder; // Inyectamos para hashear la nueva contraseña

    @Override
    public MessageDto requestPasswordReset(ResetPasswordRequestDto requestDto) {
        Users user = userService.findByEmail(requestDto.getEmail()); // Lanza EntityNotFoundException si no existe

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
    public MessageDto confirmPasswordReset(ConfirmResetRequestDto requestDto) {
        // Buscar el token
        PasswordResetToken tokenEntity = tokenRepository.findByToken(requestDto.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        // Verificar si ha expirado
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(tokenEntity); // Opcional: limpiar tokens expirados
            throw new IllegalArgumentException("El token ha expirado");
        }

        // Actualizar la contraseña
        Users user = tokenEntity.getUser();
        user.setPassword(passwordEncoder.encode(requestDto.getNewPassword()));
        userService.save(user);

        // Eliminar el token usado
        tokenRepository.delete(tokenEntity);

        return new MessageDto("Contraseña restablecida con éxito");
    }
}