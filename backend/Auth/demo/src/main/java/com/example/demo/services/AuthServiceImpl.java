package com.example.demo.services;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.entities.Users;
import com.example.demo.entities.Users.Role;
import com.example.demo.interfaces.AuthService;
import com.example.demo.interfaces.UserService;
import com.example.demo.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private UserService userService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public MessageDto login(LoginRequestDto loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);
        return new MessageDto("Login exitoso, token: " + token);
    }

    @Override
    public MessageDto register(RegisterRequestDto registerRequest) {
        // Verificar si el email ya está en uso
        if (userService.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        // Crear nuevo usuario
        Users newUser = new Users();
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setRole(Role.USER);
        newUser.setCreatedAt(LocalDateTime.now());

        // Guardar el usuario
        userService.save(newUser);

        return new MessageDto("Usuario registrado exitosamente");
    }
}