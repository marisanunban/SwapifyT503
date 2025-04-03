package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.*;
import com.example.demo.services.TransactionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionServiceImpl transactionService;
    private final AuthClient authClient;
    private final UserClient userClient;

    public TransactionController(TransactionServiceImpl transactionService,
                                 AuthClient authClient,
                                 UserClient userClient) {
        this.transactionService = transactionService;
        this.authClient = authClient;
        this.userClient = userClient;
    }

    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(
            @RequestBody CreateTransactionDto dto,
            @RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "").trim();
            UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

            if (userInfo == null) {
                System.out.println("Token inválido o no se pudo validar al usuario");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Obtener el usuario por email para verificar créditos
            System.out.println("Obteniendo usuario por email: " + userInfo.getEmail());
            UserDto buyer = userClient.getUserByEmail(userInfo.getEmail(), "Bearer " + cleanToken);
            if (buyer == null) {
                System.out.println("Usuario no encontrado para el email: " + userInfo.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Verificar créditos
            if (dto.getCreditsOffered() != null && buyer.getCredits() < dto.getCreditsOffered()) {
                System.out.println("Créditos insuficientes. Disponibles: " + buyer.getCredits() + ", Requeridos: " + dto.getCreditsOffered());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            TransactionDto transaction = transactionService.createTransaction(
                    dto,
                    userInfo.getId(),
                    "Bearer " + cleanToken
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);

        } catch (EntityNotFoundException e) {
            System.out.println("No encontrado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            System.out.println("Argumento inválido: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            System.out.println("Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TransactionDto> updateTransactionStatus(
            @PathVariable("id") Long id,
            @RequestBody UpdateTransactionStatusDto dto,
            @RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "").trim();
            System.out.println("Token limpio: " + cleanToken);

            System.out.println("Validando token...");
            UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);
            if (userInfo == null) {
                System.out.println("Token inválido o no se pudo validar al usuario");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            System.out.println("Usuario validado: " + userInfo.getEmail());

            System.out.println("Obteniendo usuario por email: " + userInfo.getEmail());
            UserDto user = userClient.getUserByEmail(userInfo.getEmail(), "Bearer " + cleanToken);
            if (user == null) {
                System.out.println("Usuario no encontrado para el email: " + userInfo.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            System.out.println("Usuario obtenido: " + user.getEmail());

            System.out.println("Obteniendo transacción: " + id);
            TransactionDto transactionDto = transactionService.getTransaction(id, "Bearer " + cleanToken);
            if (transactionDto == null) {
                System.out.println("Transacción no encontrada para el ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            System.out.println("Transacción obtenida: " + transactionDto.getId());

            // Obtener el email del vendedor por su ID
            System.out.println("Obteniendo vendedor por ID: " + transactionDto.getSellerId());
            UserDto seller = userClient.getUser(transactionDto.getSellerId(), "Bearer " + cleanToken);
            if (seller == null) {
                System.out.println("Vendedor no encontrado para el ID: " + transactionDto.getSellerId());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            System.out.println("Vendedor obtenido: " + seller.getEmail());

            // Comparar emails
            if (!user.getEmail().equals(seller.getEmail())) {
                System.out.println("Usuario no autorizado. Email del token: " + user.getEmail() +
                        ", Email del vendedor: " + seller.getEmail());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            System.out.println("Actualizando estado de la transacción...");
            TransactionDto updatedTransaction = transactionService.updateTransactionStatus(
                    id, dto, "Bearer " + cleanToken);
            System.out.println("Estado actualizado: " + updatedTransaction.getStatus());

            return ResponseEntity.ok(updatedTransaction);

        } catch (Exception e) {
            System.out.println("Error al actualizar estado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}