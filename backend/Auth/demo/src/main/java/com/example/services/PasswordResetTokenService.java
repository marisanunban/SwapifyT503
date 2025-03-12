package com.example.services;

import com.example.DAOs.IPasswordResetTokenDAO;
import com.example.DTOs.PasswordResetTokenDTO;
import com.example.entities.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.entities.PasswordResetToken;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetTokenService {

    @Autowired
    private IPasswordResetTokenDAO tokenRepository;

    // Método para guardar el token, trabajando con PasswordResetTokenDTO
    public PasswordResetTokenDTO save(PasswordResetTokenDTO tokenDTO) {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken(tokenDTO.getToken());
        token.setExpiresAt(tokenDTO.getExpiresAt());
        token.setUser(tokenDTO.getUser());

        // Guardar en la base de datos
        token = tokenRepository.save(token);

        // Mapear de nuevo a DTO para la respuesta
        return mapToDTO(token);
    }

    // Método para buscar por token
    public Optional<PasswordResetTokenDTO> findByToken(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.map(this::mapToDTO);
    }

    // Método para eliminar un token por su ID
    public void delete(Long id) {
        tokenRepository.deleteById(id);
    }

    // Método para verificar si el token ha expirado
    public boolean isTokenExpired(PasswordResetTokenDTO tokenDTO) {
        return tokenDTO.getExpiresAt().isBefore(ChronoLocalDateTime.from(Instant.now()));
    }

    // Método para generar un nuevo token y devolverlo como DTO
    public PasswordResetTokenDTO generateResetToken(Users user) {
        String tokenValue = java.util.UUID.randomUUID().toString();  // Usar UUID para el token
        Instant expiresAt = Instant.now().plusSeconds(3600);  // Expira en 1 hora
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(tokenValue);
        token.setExpiresAt(LocalDateTime.from(expiresAt));

        // Guardar token y devolverlo como DTO
        return save(mapToDTO(token));
    }

    // Mapear entidad a DTO
    private PasswordResetTokenDTO mapToDTO(PasswordResetToken token) {
        PasswordResetTokenDTO dto = new PasswordResetTokenDTO();
        dto.setId(token.getId());
        dto.setToken(token.getToken());
        dto.setExpiresAt(token.getExpiresAt());
        dto.setUser(token.getUser());
        return dto;
    }

    // Mapear DTO a entidad (por ejemplo, al guardar)
    private PasswordResetToken mapToEntity(PasswordResetTokenDTO dto) {
        PasswordResetToken token = new PasswordResetToken();
        token.setId(dto.getId());
        token.setToken(dto.getToken());
        token.setExpiresAt(dto.getExpiresAt());
        token.setUser(dto.getUser());
        return token;
    }
}
