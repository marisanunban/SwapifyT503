package com.example.demo.interfaces;

import reactor.core.publisher.Mono;

public interface NotificationService {

    Mono<Void> notifyNewTransaction(Long sellerId, Long buyerId, Long transactionId, String productTitle);

    Mono<Void> notifyTransactionUpdate(Long buyerId, Long sellerId, Long transactionId, String status);
}