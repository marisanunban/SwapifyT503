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
    private PasswordEncoder passwordEncoder; // Inyectamos el PasswordEncoder

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

        // Desactivar el envío de correo para pruebas
        // emailService.sendResetPasswordEmail(requestDto.getEmail(), resetToken);

        return new MessageDto("Correo enviado (simulado para pruebas)");
    }

    @Override
    public void confirmPasswordReset(ConfirmResetRequestDto requestDto) {
        // Buscar el token en la base de datos
        PasswordResetToken tokenEntity = tokenRepository.findByToken(requestDto.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        // Verificar si el token ha expirado
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El token ha expirado");
        }

        // Obtener el usuario asociado al token
        Users user = tokenEntity.getUser();

        // Hashear la nueva contraseña con BCrypt antes de guardarla
        user.setPassword(passwordEncoder.encode(requestDto.getNewPassword()));
        userService.save(user);

        // Eliminar el token usado
        tokenRepository.delete(tokenEntity);
    }
}