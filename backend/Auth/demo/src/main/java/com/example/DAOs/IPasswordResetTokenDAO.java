package com.example.DAOs;

import com.example.entities.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface IPasswordResetTokenDAO extends JpaRepository<PasswordResetToken, Integer> {
    // Buscar un token por su valor (token)
    Optional<PasswordResetToken> findByToken(String token);

    // Eliminar un token por su ID
    void deleteById(Long id);

    // Verificar si existe un token por usuario
    Optional<PasswordResetToken> findByUserId(Long userId);
}
