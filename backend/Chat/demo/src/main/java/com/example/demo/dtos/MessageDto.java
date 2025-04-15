package com.example.demo.dtos;

public record MessageDto(
        Long id,             // ID del mensaje
        Long conversationId, // ID de la conversación a la que pertenece
        Long senderId,       // ID del usuario que envió el mensaje
        String content,      // Contenido del mensaje
        String timestamp,    // Fecha y hora del mensaje
        String type,          // Tipo de mensaje (TEXT, PROPOSAL)
        String productId) {}