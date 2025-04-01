package com.example.demo.services;

import com.example.demo.interfaces.NotificationService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public Mono<Void> notifyNewTransaction(Long sellerId, Long buyerId, Long transactionId, String productTitle) {
        // En producción: enviar notificación push, email, etc.
        System.out.printf(
                "Notificación para usuario %d: Nuevo trueque propuesto por usuario %d (ID transacción: %s, Producto: %s)%n",
                sellerId, buyerId, transactionId, productTitle
        );
        return Mono.empty(); // Devolvemos un Mono<Void> vacío
    }

    @Override
    public Mono<Void> notifyTransactionUpdate(Long buyerId, Long sellerId, Long transactionId, String status) {
        System.out.printf(
                "Notificación para usuario %d: El usuario %d ha %s el trueque (ID transacción: %s)%n",
                buyerId, sellerId, status.toLowerCase(), transactionId
        );
        return Mono.empty(); // Devolvemos un Mono<Void> vacío
    }
}