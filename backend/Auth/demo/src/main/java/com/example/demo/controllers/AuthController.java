package com.example.demo.controllers;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.entities.Users;
import com.example.demo.entities.Users.Role; // Importamos el enum Role
import com.example.demo.interfaces.UserService;
import com.example.demo.security.JwtTokenProvider;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          UserService userService,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<MessageDto> login(@RequestBody LoginRequestDto loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new MessageDto("Login exitoso, token: " + token));
    }

    @PostMapping("/register")
    public ResponseEntity<MessageDto> register(@RequestBody RegisterRequestDto registerRequest) {
        // Verificar si el email ya está en uso
        try {
            userService.findByEmail(registerRequest.getEmail());
            return ResponseEntity.badRequest().body(new MessageDto("El email ya está registrado"));
        } catch (EntityNotFoundException e) {
            // El email no existe, podemos proceder
        }

        // Crear nuevo usuario
        Users newUser = new Users();
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword())); // Hashear aquí
        newUser.setRole(Role.USER); // Usar el enum Role.USER
        newUser.setCreatedAt(LocalDateTime.now());

        // Guardar el usuario
        userService.save(newUser);

        return ResponseEntity.ok(new MessageDto("Usuario registrado exitosamente"));
    }
}