package com.example.demo.controllers;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.services.PasswordResetServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
        // Log inicial: Confirmar que la solicitud llega al controlador
        System.out.println("Solicitud recibida en /auth/reset-password para email: " + requestDto.getEmail());

        try {
            // Llamar al servicio
            System.out.println("Llamando a passwordResetService.requestPasswordReset con email: " + requestDto.getEmail());
            MessageDto responseDto = passwordResetService.requestPasswordReset(requestDto);
            System.out.println("Respuesta generada por el servicio: " + responseDto.getMessage());

            // Log antes de devolver la respuesta
            System.out.println("Enviando respuesta: " + responseDto.getMessage());
            return ResponseEntity.accepted().body(responseDto);
        } catch (Exception e) {
            // Capturar cualquier excepción inesperada
            System.out.println("Excepción en /auth/reset-password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageDto("Error interno: " + e.getMessage()));
        }
    }
    @PostMapping("/confirm-reset")
    public ResponseEntity<MessageDto> confirmPasswordReset(@RequestBody ConfirmResetRequestDto requestDto) {
        System.out.println("Solicitud recibida en /auth/confirm-reset con token: " + requestDto.getToken());
        try {
            passwordResetService.confirmPasswordReset(requestDto);
            System.out.println("Contraseña restablecida con éxito");
            return ResponseEntity.ok(new MessageDto("Contraseña restablecida con éxito"));
        } catch (IllegalArgumentException e) {
            System.out.println("Error en /auth/confirm-reset: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageDto("Error: " + e.getMessage()));
        } catch (Exception e) {
            System.out.println("Excepción en /auth/confirm-reset: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageDto("Error interno: " + e.getMessage()));
        }
    }
}