package com.example.demo.serviceImplTests;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.entities.PasswordResetToken;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.EmailService;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.PasswordResetRepository;
import com.example.demo.services.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    @Mock
    private UserService userService;
    @Mock
    private PasswordResetRepository tokenRepository;
    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private Users user;
    private ResetPasswordRequestDto resetPasswordRequestDto;

    @BeforeEach
    void setUp() {
        user = new Users();
        user.setEmail("test@example.com");

        resetPasswordRequestDto = new ResetPasswordRequestDto();
        resetPasswordRequestDto.setUseremail("test@example.com");
    }

    @Test
    void requestPasswordReset_ShouldSaveTokenAndSendEmail() {
        when(userService.findByEmail("test@example.com")).thenReturn(user);

        MessageDto response = passwordResetService.requestPasswordReset(resetPasswordRequestDto);

        assertEquals("Correo enviado (simulado para pruebas)", response.getMessage());

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken.getToken());
        assertTrue(savedToken.getExpiresAt().isAfter(LocalDateTime.now()));

        verify(emailService).sendResetPasswordEmail(eq("test@example.com"), eq(savedToken.getToken()));
    }

    @Test
    void confirmPasswordReset_ShouldUpdatePasswordAndDeleteToken() {
        String token = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setToken(token);
        tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(1));
        tokenEntity.setUser(user);

        when(tokenRepository.findByToken(token)).thenReturn(Optional.of(tokenEntity));

        MessageDto response = passwordResetService.confirmPasswordReset(
                new ConfirmResetRequestDto(token, "newPassword123")
        );

        assertEquals("Contraseña restablecida con éxito", response.getMessage());

        verify(userService).save(user);
        verify(tokenRepository).delete(tokenEntity);
    }

    @Test
    void confirmPasswordReset_ShouldThrowExceptionIfTokenExpired() {
        String token = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setToken(token);
        tokenEntity.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // Token expirado
        tokenEntity.setUser(user);

        when(tokenRepository.findByToken(token)).thenReturn(Optional.of(tokenEntity));

        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.confirmPasswordReset(new ConfirmResetRequestDto(token, "newPassword123"))
        );

        assertEquals("El token ha expirado", exception.getMessage());

        verify(tokenRepository).delete(tokenEntity); // Se asegura de que se elimina el token expirado
    }
}
