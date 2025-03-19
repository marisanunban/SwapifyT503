package com.example.demo.controllers;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

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
    @GetMapping("/validate-user")
    public ResponseEntity<UserInfoDto> validateCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof Users user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // Sin cuerpo, solo 401
        }
        UserInfoDto userInfo = new UserInfoDto(user.getId(), user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(userInfo);
    }


}