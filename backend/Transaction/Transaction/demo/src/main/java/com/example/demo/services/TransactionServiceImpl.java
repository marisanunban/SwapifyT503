package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.*;
import com.example.demo.entities.Transaction;
import com.example.demo.interfaces.NotificationService;
import com.example.demo.interfaces.TransactionService;
import com.example.demo.repositories.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final ProductClient productClient;
    private final UserClient userClient;
    private final NotificationService notificationService;
    private final AuthClient authClient;

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            ProductClient productClient,
            UserClient userClient,
            NotificationService notificationService,
            AuthClient authClient
    ) {
        this.transactionRepository = transactionRepository;
        this.productClient = productClient;
        this.userClient = userClient;
        this.notificationService = notificationService;
        this.authClient = authClient;
    }

    @Transactional
    public TransactionDto createTransaction(CreateTransactionDto dto, String authToken) {
        // 1. Validar token y extraer información del vendedor
        UserInfoDto sellerInfo = authClient.validateUserToken(authToken, null);
        if (sellerInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        // 2. Validar producto ofrecido (si existe)
        if (dto.getProductOfferedId() != null) {
            ProductDto offeredProduct = productClient.getProduct(dto.getProductOfferedId());
            if (offeredProduct == null) {
                throw new EntityNotFoundException("Producto ofrecido no encontrado: " + dto.getProductOfferedId());
            }

            // Logs para depuración (opcional)
            System.out.println("sellerInfo.getId(): " + sellerInfo.getId() + " (tipo: " + sellerInfo.getId().getClass().getName() + ")");
            System.out.println("offeredProduct.getOwnerId(): " + offeredProduct.getOwnerId() + " (tipo: " + offeredProduct.getOwnerId().getClass().getName() + ")");

            // Validación reforzada: comparar IDs con conversión de tipo
            if (!String.valueOf(sellerInfo.getId()).equals(offeredProduct.getOwnerId())) {
                throw new IllegalArgumentException(
                        String.format("El producto %s no pertenece al vendedor %s",
                                dto.getProductOfferedId(), sellerInfo.getId())
                );
            }
        }

        // 3. Crear transacción
        Transaction transaction = new Transaction();
        transaction.setSellerId(sellerInfo.getId());
        transaction.setSellerEmail(sellerInfo.getEmail());
        transaction.setProductOfferedId(dto.getProductOfferedId());
        transaction.setCreditsOffered(Optional.ofNullable(dto.getCreditsOffered()).orElse(0));
        transaction.setStatus(Transaction.Status.PENDING);  // Establecer estado inicial
        transaction.setCreatedAt(LocalDateTime.now());

        return mapToDto(transactionRepository.save(transaction));
    }

    // Resto del código sin cambios (updateTransactionStatus, getTransaction, getUserTransactions, mapToDto)
    @Transactional
    public TransactionDto updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken) {
        System.out.println("Actualizando estado de transacción con ID: " + id);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        // Obtener la información del usuario autenticado desde el token
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        // Primera actualización (comprador establece estado PENDING)
        if (transaction.getBuyerEmail() == null) {
            if (!dto.getStatus().equalsIgnoreCase("PENDING")) {
                throw new IllegalArgumentException("First update must be to PENDING");
            }

            // Validar producto solicitado solo si se proporciona
            if (dto.getProductRequestedId() != null) {
                ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
                if (requestedProduct == null) {
                    throw new EntityNotFoundException("Requested product not found: " + dto.getProductRequestedId());
                }
                if (!requestedProduct.getOwnerId().equals(String.valueOf(userInfo.getId()))) {
                    throw new IllegalArgumentException("Requested product doesn't belong to buyer");
                }
                transaction.setProductRequestedId(dto.getProductRequestedId());
            }

            transaction.setBuyerId(userInfo.getId());
            transaction.setBuyerEmail(userInfo.getEmail());  // Usar email del token
            transaction.setStatus(Transaction.Status.PENDING);

            Transaction updatedTransaction = transactionRepository.save(transaction);
            notificationService.notifyNewTransaction(
                    transaction.getSellerId(),
                    userInfo.getId(),
                    id,
                    dto.getProductRequestedId() != null ? productClient.getProduct(dto.getProductRequestedId()).getTitle() : "No product offered"
            );

            return mapToDto(updatedTransaction);
        }

        // Segunda actualización (solo el vendedor puede aceptar/rechazar)
        else {
            if (!transaction.getSellerId().equals(userInfo.getId())) {
                throw new IllegalArgumentException("Only the seller can accept/reject the transaction");
            }

            if (transaction.getStatus() != Transaction.Status.PENDING) {
                throw new IllegalStateException("Can only update PENDING transactions");
            }

            String newStatus = dto.getStatus().toUpperCase();
            if (newStatus.equals("ACCEPTED")) {
                if (transaction.getProductRequestedId() != null) {
                    productClient.transferProduct(
                            transaction.getProductRequestedId(),
                            transaction.getBuyerId(),  // Cambiado de user.getId() a buyerId ya seteado
                            transaction.getSellerId(),
                            authToken
                    );
                }

                if (transaction.getProductOfferedId() != null) {
                    productClient.transferProduct(
                            transaction.getProductOfferedId(),
                            transaction.getSellerId(),
                            transaction.getBuyerId(),
                            authToken
                    );
                }

                if (transaction.getCreditsOffered() > 0) {
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
            } else {
                throw new IllegalArgumentException("Status must be ACCEPTED or REJECTED");
            }

            transaction.setUpdatedAt(LocalDateTime.now());
            Transaction updatedTransaction = transactionRepository.save(transaction);
            notificationService.notifyTransactionUpdate(
                    transaction.getBuyerId(),
                    transaction.getSellerId(),
                    id,
                    updatedTransaction.getStatus().toString()
            );

            return mapToDto(updatedTransaction);
        }
    }

    public TransactionDto getTransaction(Long id, String authToken) {
        System.out.println("Obteniendo transacción con ID: " + id);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));
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
                transaction.getSellerEmail(),
                transaction.getProductRequestedId(),
                transaction.getProductOfferedId(),
                transaction.getCreditsOffered(),
                transaction.getStatus() != null ? transaction.getStatus().toString() : null,
                transaction.getCreatedAt().toString()
        );
    }
}