package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.*;
import com.example.demo.services.TransactionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionServiceImpl transactionService;
    private final AuthClient authClient;
    private final UserClient userClient;

    public TransactionController(
            TransactionServiceImpl transactionService,
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

        String cleanToken = token.replace("Bearer ", "").trim();
        UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

        if (userInfo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TransactionDto transaction = transactionService.createTransaction(dto, "Bearer " + cleanToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TransactionDto> updateTransactionStatus(
            @PathVariable("id") Long id,
            @RequestBody UpdateTransactionStatusDto dto,
            @RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "").trim();
            UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            TransactionDto updatedTransaction = transactionService.updateTransactionStatus(
                    id,
                    dto,
                    "Bearer " + cleanToken
            );
            return ResponseEntity.ok(updatedTransaction);

        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransaction(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "").trim();
            UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            TransactionDto transaction = transactionService.getTransaction(id, "Bearer " + cleanToken);
            return ResponseEntity.ok(transaction);

        } catch (EntityNotFoundException e) {
            System.out.println("Error: Transacción no encontrada: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}