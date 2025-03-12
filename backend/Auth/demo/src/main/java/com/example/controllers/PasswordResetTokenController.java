package com.example.controllers;


import com.example.DAOs.IPasswordResetTokenDAO;
import com.example.DTOs.PasswordResetTokenDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class PasswordResetTokenController {

    @Autowired
    private IPasswordResetTokenDAO tokenService;


    // Solicitar restablecimiento de contraseña
    @PostMapping("/reset-password")
    public ResponseEntity<String> requestPasswordReset(@RequestBody ResetPasswordRequest request) {
        String email = request.getEmail();
        Users user = userService.findByEmail(email);

        if (user == null) {
            return ResponseEntity.status(404).body("Usuario no encontrado");
        }

        // Generar un nuevo token de restablecimiento
        PasswordResetTokenDTO token = tokenService.generateResetToken(user);

        // Enviar un correo con el enlace del token
        emailService.sendResetPasswordEmail(email, token.getToken());

        return ResponseEntity.accepted().body("Correo enviado");
    }

    // Confirmar el restablecimiento de la contraseña
    @PostMapping("/reset-password/confirm")
    public ResponseEntity<String> confirmPasswordReset(@RequestBody ConfirmResetRequest request) {
        String tokenValue = request.getToken();
        Optional<PasswordResetTokenDTO> tokenOpt = tokenService.findByToken(tokenValue);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Token no válido");
        }

        PasswordResetTokenDTO token = tokenOpt.get();

        // Verificar si el token ha expirado
        if (tokenService.isTokenExpired(token)) {
            return ResponseEntity.badRequest().body("Token expirado");
        }

        // Obtener el usuario asociado al token
        User user = token.getUser();
        userService.updatePassword(user, request.getNewPassword());

        // Eliminar el token después de usarlo
        tokenService.delete(token.getId());

        return ResponseEntity.ok("Contraseña actualizada");
    }
}
