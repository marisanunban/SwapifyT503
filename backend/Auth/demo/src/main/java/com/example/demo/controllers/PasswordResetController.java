package com.example.demo.controllers;


import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.services.PasswordResetServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class PasswordResetController {

    private final PasswordResetServiceImpl passwordResetService;

    @Autowired
    public PasswordResetController(PasswordResetServiceImpl passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageDto> requestPasswordReset(@RequestBody ResetPasswordRequestDto requestDto) {
        MessageDto responseDto = passwordResetService.requestPasswordReset(requestDto);
        return ResponseEntity.accepted().body(responseDto);
    }
}