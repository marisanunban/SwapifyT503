package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.services.TransactionServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionServiceImpl transactionService;
    private final AuthClient authClient;

    public TransactionController(TransactionServiceImpl transactionService, AuthClient authClient) {
        this.transactionService = transactionService;
        this.authClient = authClient;
    }

    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(
            @RequestBody CreateTransactionDto dto,
            @RequestHeader("Authorization") String token) {

        try {
            // 1. Validación del token (que sabemos que funciona)
            String cleanToken = token.replace("Bearer ", "").trim();
            UserInfoDto userInfo = authClient.validateUserToken(cleanToken, null)
                    .doOnSuccess(u -> System.out.println("Token validado para usuario: " + u.getId()))
                    .block();

            if (userInfo == null) {
                System.out.println("Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // 2. Debug: Verificar datos antes de crear transacción
            System.out.println("Creando transacción para: ");
            System.out.println("Comprador (token): " + userInfo.getId());
            System.out.println("Vendedor (dto): " + dto.getSellerId());
            System.out.println("Producto solicitado: " + dto.getProductRequestedId());

            // 3. Crear transacción
            TransactionDto transactionDto = transactionService.createTransaction(dto, userInfo.getId())
                    .doOnSuccess(t -> System.out.println("Transacción creada: " + t.getId()))
                    .doOnError(e -> System.out.println("Error al crear transacción: " + e.getMessage()))
                    .block();

            return ResponseEntity.status(HttpStatus.CREATED).body(transactionDto);

        } catch (Exception e) {
            System.out.println("ERROR NO CONTROLADO: " + e.getClass().getSimpleName());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}