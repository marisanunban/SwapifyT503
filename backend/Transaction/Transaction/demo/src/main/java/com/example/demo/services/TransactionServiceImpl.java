package com.example.demo.services;

import com.example.demo.clients.ProductClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.entities.Transaction;
import com.example.demo.interfaces.NotificationService;
import com.example.demo.repositories.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
public class TransactionServiceImpl {

    private final TransactionRepository transactionRepository;
    private final ProductClient productClient;
    private final UserClient userClient;
    private final NotificationService notificationService;

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            ProductClient productClient,
            UserClient userClient,
            NotificationService notificationService
    ) {
        this.transactionRepository = transactionRepository;
        this.productClient = productClient;
        this.userClient = userClient;
        this.notificationService = notificationService;
    }

        @Transactional
        public Mono<TransactionDto> createTransaction(CreateTransactionDto dto, Long buyerId) {
            return productClient.getProduct(dto.getProductRequestedId())
                    .switchIfEmpty(Mono.error(new EntityNotFoundException("Producto solicitado con ID " + dto.getProductRequestedId() + " no encontrado")))
                    .flatMap(requestedProduct -> {
                        if (!requestedProduct.getOwnerId().equals(dto.getSellerId())) {
                            return Mono.error(new IllegalArgumentException("El producto solicitado no pertenece al vendedor especificado"));
                        }

                        Mono<Void> productValidation = Mono.empty();
                        if (dto.getProductOfferedId() != null) {
                            productValidation = productClient.getProduct(dto.getProductOfferedId())
                                    .switchIfEmpty(Mono.error(new EntityNotFoundException("Producto ofrecido con ID " + dto.getProductOfferedId() + " no encontrado")))
                                    .flatMap(offeredProduct -> {
                                        if (!offeredProduct.getOwnerId().equals(buyerId)) {
                                            return Mono.error(new IllegalArgumentException("El producto ofrecido no te pertenece"));
                                        }
                                        return Mono.empty();
                                    });
                        }

                        Mono<Void> creditValidation = Mono.empty();
                        if (dto.getCreditsOffered() != null && dto.getCreditsOffered() > 0) {
                            creditValidation = userClient.getUser(buyerId)
                                    .switchIfEmpty(Mono.error(new EntityNotFoundException("Usuario comprador con ID " + buyerId + " no encontrado")))
                                    .flatMap(buyer -> {
                                        if (buyer.getCredits() < dto.getCreditsOffered()) {
                                            return Mono.error(new IllegalArgumentException("Créditos insuficientes"));
                                        }
                                        return Mono.empty();
                                    });
                        }

                        return Mono.when(productValidation, creditValidation)
                                .then(Mono.defer(() -> {
                                    Transaction transaction = new Transaction();
                                    transaction.setBuyerId(buyerId);
                                    transaction.setSellerId(dto.getSellerId());
                                    transaction.setProductRequestedId(dto.getProductRequestedId());
                                    transaction.setProductOfferedId(dto.getProductOfferedId());
                                    transaction.setCreditsOffered(dto.getCreditsOffered() != null ? dto.getCreditsOffered() : 0);
                                    transaction.setStatus(Transaction.Status.PENDING);
                                    transaction.setCreatedAt(LocalDateTime.now());

                                    return Mono.fromCallable(() -> transactionRepository.save(transaction))
                                            .flatMap(savedTransaction -> {
                                                notificationService.notifyNewTransaction(
                                                        dto.getSellerId(),
                                                        buyerId,
                                                        savedTransaction.getId(),
                                                        requestedProduct.getTitle()
                                                );
                                                return Mono.just(mapToDto(savedTransaction));
                                            });
                                }));
                    });
        }

    private TransactionDto mapToDto(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getBuyerId(),
                transaction.getSellerId(),
                transaction.getProductRequestedId(),
                transaction.getProductOfferedId(),
                transaction.getCreditsOffered(),
                transaction.getStatus().toString(),
                transaction.getCreatedAt().toString()
        );
    }
}