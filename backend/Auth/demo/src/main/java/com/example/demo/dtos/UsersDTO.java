package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.management.relation.Role;
import java.time.LocalDateTime;

@Data  // Genera automáticamente getters, setters, toString, equals y hashCode
@NoArgsConstructor  // Constructor vacío
@AllArgsConstructor // Constructor con todos los campos
@Builder // Patrón Builder para crear objetos de forma fluida
public class UsersDTO {
    private Long id;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}