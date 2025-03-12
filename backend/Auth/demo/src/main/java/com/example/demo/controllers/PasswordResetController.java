package com.example.demo.controllers;


import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.dtos.ResetPasswordResponseDto;
import com.example.demo.services.PasswordResetServiceImpl; // Ajusta el paquete según tu estructura
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetServiceImpl passwordResetService;

    @PostMapping("/reset-password")
    public ResponseEntity<ResetPasswordResponseDto> requestPasswordReset(@RequestBody ResetPasswordRequestDto requestDto) {
        ResetPasswordResponseDto responseDto = passwordResetService.requestPasswordReset(requestDto);
        return ResponseEntity.accepted().body(responseDto);
    }
}