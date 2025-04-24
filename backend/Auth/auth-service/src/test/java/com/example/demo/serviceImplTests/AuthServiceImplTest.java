package com.example.demo.serviceImplTests;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.UserService;
import com.example.demo.security.JwtTokenProvider;
import com.example.demo.services.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private UserService userService;
    @Mock
    private Authentication authentication;
    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequestDto registerRequest;
    private LoginRequestDto loginRequest;

    @BeforeEach
    public void setUp() {
        registerRequest = new RegisterRequestDto("test@example.com", "password123");
        loginRequest = new LoginRequestDto("test@example.com", "password123");
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyExists() {
        // Arrange
        when(userService.existsByEmail(registerRequest.getUseremail())).thenReturn(true);  // El email ya existe

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> authService.register(registerRequest),
                "El email ya está registrado");
    }

    @Test
    void register_ShouldRegisterUser_WhenEmailDoesNotExist() {
        // Arrange
        when(userService.existsByEmail(registerRequest.getUseremail())).thenReturn(false);  // El email no existe

        // Act
        MessageDto response = authService.register(registerRequest);

        // Assert
        assertEquals("Usuario registrado exitosamente", response.getMessage());
        verify(userService, times(1)).save(any(Users.class));  // Verifica que el usuario fue guardado
    }

    @Test
    void login_ShouldReturnToken_WhenCredentialsAreValid() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("mock-jwt-token");

        // Act
        MessageDto response = authService.login(loginRequest);

        // Assert
        assertTrue(response.getMessage().contains("Login exitoso, token: mock-jwt-token"));
    }
}
