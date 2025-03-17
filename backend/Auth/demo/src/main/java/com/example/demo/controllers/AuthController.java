package com.example.demo.controllers;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.interfaces.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<MessageDto> login(@RequestBody LoginRequestDto loginRequest) {
        MessageDto responseDto = authService.login(loginRequest);
        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/register")
    public ResponseEntity<MessageDto> register(@RequestBody RegisterRequestDto registerRequest) {
        MessageDto responseDto = authService.register(registerRequest);
        return ResponseEntity.ok(responseDto);
    }
}