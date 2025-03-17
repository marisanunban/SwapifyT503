package com.example.demo.controllerTests;

import com.example.demo.controllers.PasswordResetController;
import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.services.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class PasswordResetControllerTest {

    @Mock
    private PasswordResetServiceImpl passwordResetService;  // Mock del servicio

    @InjectMocks
    private PasswordResetController passwordResetController;  // Controlador a probar

    private ResetPasswordRequestDto resetPasswordRequestDto;
    private ConfirmResetRequestDto confirmResetRequestDto;

    @BeforeEach
    public void setUp() {
        // Inicializa los DTOs que se van a usar en los tests
        resetPasswordRequestDto = new ResetPasswordRequestDto("test@example.com");
        confirmResetRequestDto = new ConfirmResetRequestDto("token123", "newPassword123");
    }

    @Test
    void requestPasswordReset_ShouldReturnAccepted_WhenValidRequest() {
        // Arrange
        when(passwordResetService.requestPasswordReset(resetPasswordRequestDto))
                .thenReturn(new MessageDto("Instrucciones para restablecer la contraseña enviadas"));

        // Act
        ResponseEntity<MessageDto> response = passwordResetController.requestPasswordReset(resetPasswordRequestDto);

        // Assert
        assertEquals(202, response.getStatusCodeValue());  // Verifica que el código de estado sea 202 Accepted
        assertEquals("Instrucciones para restablecer la contraseña enviadas", response.getBody().getMessage());
        verify(passwordResetService, times(1)).requestPasswordReset(resetPasswordRequestDto);  // Verifica que se haya llamado al servicio
    }

    @Test
    void confirmPasswordReset_ShouldReturnOk_WhenValidRequest() {
        // Arrange
        when(passwordResetService.confirmPasswordReset(confirmResetRequestDto))
                .thenReturn(new MessageDto("Contraseña restablecida con éxito"));

        // Act
        ResponseEntity<MessageDto> response = passwordResetController.confirmPasswordReset(confirmResetRequestDto);

        // Assert
        assertEquals(200, response.getStatusCodeValue());  // Verifica que el código de estado sea 200 OK
        assertEquals("Contraseña restablecida con éxito", response.getBody().getMessage());
        verify(passwordResetService, times(1)).confirmPasswordReset(confirmResetRequestDto);  // Verifica que se haya llamado al servicio
    }

    @Test
    void requestPasswordReset_ShouldThrowException_WhenEmailNotFound() {
        // Arrange
        when(passwordResetService.requestPasswordReset(resetPasswordRequestDto))
                .thenThrow(new IllegalArgumentException("Correo electrónico no encontrado"));

        // Act & Assert
        try {
            passwordResetController.requestPasswordReset(resetPasswordRequestDto);
            fail("Se esperaba una IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertEquals("Correo electrónico no encontrado", e.getMessage());
        }
    }
}
