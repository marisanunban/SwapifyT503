package com.example.demo.services;

import com.example.demo.clients.ProductClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UpdateTransactionStatusDto;
import com.example.demo.dtos.UserDto;
import com.example.demo.entities.Transaction;
import com.example.demo.interfaces.NotificationService;
import com.example.demo.interfaces.TransactionService;
import com.example.demo.repositories.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionServiceImpl implements TransactionService {

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
    public TransactionDto createTransaction(CreateTransactionDto dto, Long buyerId, String authToken) {
        System.out.println("Iniciando creación de transacción para buyerId: " + buyerId);

        // Obtener producto solicitado
        System.out.println("Obteniendo producto solicitado: " + dto.getProductRequestedId());
        ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
        if (requestedProduct == null) {
            throw new EntityNotFoundException("Producto solicitado con ID " + dto.getProductRequestedId() + " no encontrado");
        }
        System.out.println("Producto solicitado encontrado: " + requestedProduct.getTitle());

        // Obtener el vendedor por email
        System.out.println("Obteniendo vendedor por email: " + dto.getSellerEmail());
        UserDto seller = userClient.getUserByEmail(dto.getSellerEmail(), authToken);
        if (seller == null) {
            throw new EntityNotFoundException("Vendedor con email " + dto.getSellerEmail() + " no encontrado");
        }
        Long sellerId = seller.getId();
        System.out.println("Vendedor encontrado: ID " + sellerId + ", Email: " + seller.getEmail());

        // Verificar que el producto solicitado pertenece al vendedor
        if (!requestedProduct.getOwnerId().equals(sellerId)) {
            throw new IllegalArgumentException("El producto solicitado no pertenece al vendedor con email " + dto.getSellerEmail());
        }

        // Verificar producto ofrecido (si aplica)
        if (dto.getProductOfferedId() != null) {
            System.out.println("Obteniendo producto ofrecido: " + dto.getProductOfferedId());
            ProductDto offeredProduct = productClient.getProduct(dto.getProductOfferedId());
            if (offeredProduct == null) {
                throw new EntityNotFoundException("Producto ofrecido con ID " + dto.getProductOfferedId() + " no encontrado");
            }
            if (!offeredProduct.getOwnerId().equals(buyerId)) {
                throw new IllegalArgumentException("El producto ofrecido no te pertenece");
            }
        }

        // Crear la transacción
        System.out.println("Creando transacción...");
        Transaction transaction = new Transaction();
        transaction.setBuyerId(buyerId);
        transaction.setSellerId(sellerId);
        transaction.setSellerEmail(dto.getSellerEmail()); // Guardamos el email directamente
        transaction.setProductRequestedId(dto.getProductRequestedId());
        transaction.setProductOfferedId(dto.getProductOfferedId());
        transaction.setCreditsOffered(dto.getCreditsOffered() != null ? dto.getCreditsOffered() : 0);
        transaction.setStatus(Transaction.Status.PENDING);
        transaction.setCreatedAt(LocalDateTime.now());

        System.out.println("Guardando transacción en la base de datos...");
        Transaction savedTransaction = transactionRepository.save(transaction);
        System.out.println("Transacción guardada con ID: " + savedTransaction.getId());

        System.out.println("Enviando notificación...");
        notificationService.notifyNewTransaction(
                sellerId,
                buyerId,
                savedTransaction.getId(),
                requestedProduct.getTitle()
        );
        System.out.println("Notificación enviada exitosamente");

        return mapToDto(savedTransaction);
    }

    @Transactional
    public TransactionDto updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken) {
        System.out.println("Actualizando estado de transacción con ID: " + id);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transacción con ID " + id + " no encontrada"));

        if (!transaction.getStatus().equals(Transaction.Status.PENDING)) {
            throw new IllegalStateException("Solo se pueden actualizar transacciones en estado PENDING");
        }

        String newStatus = dto.getStatus().toUpperCase();
        if (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Estado inválido: debe ser ACCEPTED o REJECTED");
        }

        if (newStatus.equals("ACCEPTED")) {
            System.out.println("Transfiriendo producto...");
            productClient.transferProduct(
                    transaction.getProductRequestedId(),
                    transaction.getSellerId(),
                    transaction.getBuyerId(),
                    authToken
            );

            if (transaction.getCreditsOffered() > 0) {
                System.out.println("Transfiriendo créditos...");
                userClient.transferCredits(
                        transaction.getBuyerId(),
                        transaction.getSellerId(),
                        transaction.getCreditsOffered(),
                        authToken
                );
            }

            transaction.setStatus(Transaction.Status.COMPLETED);
        } else if (newStatus.equals("REJECTED")) {
            transaction.setStatus(Transaction.Status.REJECTED);
        }

        transaction.setUpdatedAt(LocalDateTime.now());
        System.out.println("Guardando actualización de transacción...");
        Transaction updatedTransaction = transactionRepository.save(transaction);

        System.out.println("Enviando notificación de actualización...");
        notificationService.notifyTransactionUpdate(
                transaction.getBuyerId(),
                transaction.getSellerId(),
                updatedTransaction.getId(),
                updatedTransaction.getStatus().toString()
        );

        return mapToDto(updatedTransaction);
    }

    public TransactionDto getTransaction(Long id, String authToken) {
        System.out.println("Obteniendo transacción con ID: " + id);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transacción con ID " + id + " no encontrada"));
        return mapToDto(transaction);
    }

    public List<TransactionDto> getUserTransactions(String authToken) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    private TransactionDto mapToDto(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getBuyerId(),
                transaction.getSellerId(),
                transaction.getSellerEmail(), // Usamos el email almacenado
                transaction.getProductRequestedId(),
                transaction.getProductOfferedId(),
                transaction.getCreditsOffered(),
                transaction.getStatus().toString(),
                transaction.getCreatedAt().toString()
        );
    }
}