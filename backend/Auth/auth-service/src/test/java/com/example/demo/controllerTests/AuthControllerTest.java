package com.example.demo.controllerTests;

import com.example.demo.controllers.AuthController;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.services.AuthServiceImpl;
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
public class AuthControllerTest {

    @Mock
    private AuthServiceImpl authService;  // Mock del servicio

    @InjectMocks
    private AuthController authController;  // Controlador a probar

    private RegisterRequestDto registerRequest;

    @BeforeEach
    public void setUp() {
        registerRequest = new RegisterRequestDto("test@example.com", "password123");
    }

    @Test
    void register_ShouldReturnSuccessMessage_WhenEmailDoesNotExist() {
        // Arrange
        when(authService.register(registerRequest)).thenReturn(new MessageDto("Usuario registrado exitosamente"));

        // Act
        ResponseEntity<MessageDto> response = authController.register(registerRequest);

        // Assert
        assertEquals(200, response.getStatusCodeValue());  // Verifica que la respuesta es 200 OK
        assertEquals("Usuario registrado exitosamente", response.getBody().getMessage());
        verify(authService, times(1)).register(registerRequest);  // Verifica que se haya llamado al servicio
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyExists() {
        // Arrange
        when(authService.register(registerRequest)).thenThrow(new IllegalArgumentException("El email ya está registrado"));

        // Act
        try {
            authController.register(registerRequest);
            fail("Se esperaba una IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            // Assert
            assertEquals("El email ya está registrado", e.getMessage());
        }
    }
}
