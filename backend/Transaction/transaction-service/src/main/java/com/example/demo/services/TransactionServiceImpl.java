package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UpdateTransactionStatusDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.Transaction;
import com.example.demo.entities.Transaction.Status;
import com.example.demo.interfaces.NotificationService;
import com.example.demo.interfaces.TransactionService;
import com.example.demo.repositories.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductClient productClient;

    @Autowired
    private UserClient userClient;

    @Autowired
    private AuthClient authClient;

    @Autowired
    private NotificationService notificationService;

    // Mapa temporal para almacenar los tokens (ID de transacción -> Tokens)
    private final Map<Long, TransactionTokens> transactionTokensMap = new ConcurrentHashMap<>();

    // Formateador para convertir LocalDateTime a String
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // Clase interna para almacenar los tokens del comprador y vendedor
    private static class TransactionTokens {
        private String buyerToken;
        private String sellerToken;

        public TransactionTokens() {}

        public String getBuyerToken() { return buyerToken; }
        public void setBuyerToken(String buyerToken) { this.buyerToken = buyerToken; }
        public String getSellerToken() { return sellerToken; }
        public void setSellerToken(String sellerToken) { this.sellerToken = sellerToken; }
    }

    // Métodos para acceder al mapa
    private TransactionTokens getOrCreateTransactionTokens(Long transactionId) {
        return transactionTokensMap.computeIfAbsent(transactionId, k -> new TransactionTokens());
    }

    private void removeTransactionTokens(Long transactionId) {
        transactionTokensMap.remove(transactionId);
    }

    @Override
    @Transactional
    public TransactionDto createTransaction(CreateTransactionDto dto, String authToken) {
        System.out.println("Creando transacción con datos: " + dto.toString() + ", token: " + authToken);

        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        if (dto.getSellerId() == null || dto.getBuyerId() == null) {
            throw new IllegalArgumentException("sellerId y buyerId son requeridos");
        }

        if (dto.getProductOfferedId() != null) {
            System.out.println("Validando producto ofrecido ID: " + dto.getProductOfferedId());
            ProductDto offeredProduct = productClient.getProduct(dto.getProductOfferedId());
            if (offeredProduct == null) {
                throw new EntityNotFoundException("Producto ofrecido no encontrado: " + dto.getProductOfferedId());
            }
            if (!offeredProduct.getOwnerId().equals(String.valueOf(dto.getSellerId()))) {
                throw new IllegalArgumentException("Producto ofrecido no pertenece al vendedor: " + offeredProduct.getOwnerId() + " != " + dto.getSellerId());
            }
        }

        if (dto.getProductRequestedId() != null) {
            System.out.println("Validando producto solicitado ID: " + dto.getProductRequestedId());
            ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
            if (requestedProduct == null) {
                throw new EntityNotFoundException("Producto solicitado no encontrado: " + dto.getProductRequestedId());
            }
        }

        Transaction transaction = new Transaction();
        transaction.setSellerId(dto.getSellerId());
        transaction.setBuyerId(dto.getBuyerId());
        transaction.setProductOfferedId(dto.getProductOfferedId());
        transaction.setProductRequestedId(dto.getProductRequestedId());
        transaction.setCreditsOffered(Optional.ofNullable(dto.getCreditsOffered()).orElse(0));
        transaction.setCreditsRequested(Optional.ofNullable(dto.getCreditsRequested()).orElse(0));
        transaction.setStatus(Status.PENDING);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setBuyerAccepted(false);
        transaction.setSellerAccepted(false);
        transaction.setProcessing(false);

        Transaction savedTransaction = transactionRepository.save(transaction);
        System.out.println("Transacción creada con ID: " + savedTransaction.getId());
        return mapToDto(savedTransaction);
    }

    @Override
    @Transactional
    public TransactionDto updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken) {
        System.out.println("Actualizando estado de transacción con ID: " + id + ", status recibido: " + dto.getStatus());
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        if (transaction.getStatus() == Transaction.Status.COMPLETED || transaction.getStatus() == Transaction.Status.REJECTED) {
            System.out.println("Transacción con ID " + id + " ya ha sido procesada con estado: " + transaction.getStatus());
            return mapToDto(transaction);
        }

        if (transaction.isProcessing()) {
            System.out.println("Transacción con ID " + id + " está siendo procesada por otra solicitud");
            throw new IllegalStateException("La transacción ya está siendo procesada");
        }

        transaction.setProcessing(true);
        transactionRepository.save(transaction);

        try {
            UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
            if (userInfo == null) {
                throw new EntityNotFoundException("Token inválido o usuario no encontrado");
            }

            boolean isBuyer = userInfo.getId().equals(transaction.getBuyerId());
            boolean isSeller = userInfo.getId().equals(transaction.getSellerId());

            if (!isBuyer && !isSeller) {
                throw new IllegalArgumentException("El usuario no es parte de esta transacción");
            }

            // Capturar el token del usuario que acepta
            TransactionTokens tokens = getOrCreateTransactionTokens(id);
            if (isBuyer) {
                tokens.setBuyerToken(authToken);
            } else if (isSeller) {
                tokens.setSellerToken(authToken);
            }

            String newStatus = dto.getStatus().toUpperCase();
            if (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED")) {
                throw new IllegalArgumentException("Status must be ACCEPTED or REJECTED");
            }

            if (newStatus.equals("REJECTED")) {
                System.out.println("Usuario " + userInfo.getId() + " rechaza la transacción ID: " + id);
                transaction.setStatus(Transaction.Status.REJECTED);
            } else if (newStatus.equals("ACCEPTED")) {
                if (isBuyer) {
                    if (transaction.isBuyerAccepted()) {
                        System.out.println("El comprador ya ha aceptado la transacción ID: " + id);
                        return mapToDto(transaction);
                    }
                    System.out.println("Comprador " + userInfo.getId() + " acepta la transacción ID: " + id);
                    if (dto.getProductRequestedId() != null) {
                        System.out.println("Validando producto solicitado ID: " + dto.getProductRequestedId());
                        ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
                        if (requestedProduct == null) {
                            throw new EntityNotFoundException("Requested product not found: " + dto.getProductRequestedId());
                        }
                        if (!requestedProduct.getOwnerId().equals(String.valueOf(userInfo.getId()))) {
                            throw new IllegalArgumentException("Requested product doesn't belong to buyer: " + requestedProduct.getOwnerId() + " != " + userInfo.getId());
                        }
                        transaction.setProductRequestedId(dto.getProductRequestedId());
                    }
                    transaction.setBuyerId(userInfo.getId());
                    transaction.setBuyerAccepted(true);
                } else if (isSeller) {
                    if (transaction.isSellerAccepted()) {
                        System.out.println("El vendedor ya ha aceptado la transacción ID: " + id);
                        return mapToDto(transaction);
                    }
                    System.out.println("Vendedor " + userInfo.getId() + " acepta la transacción ID: " + id);
                    transaction.setSellerAccepted(true);
                }

                if (transaction.isBuyerAccepted() && transaction.isSellerAccepted()) {
                    System.out.println("Ambos usuarios han aceptado la transacción ID: " + id + ". Procediendo con las transferencias.");

                    // Verificar que tengamos ambos tokens
                    if (tokens.getBuyerToken() == null || tokens.getSellerToken() == null) {
                        throw new IllegalStateException("No se han capturado los tokens de ambos usuarios para la transacción ID: " + id);
                    }

                    // Cambiar el estado a COMPLETED y guardar antes de las transferencias
                    transaction.setStatus(Transaction.Status.COMPLETED);
                    transaction.setUpdatedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);

                    try {
                        // Transferencia de producto ofrecido (de seller a buyer) usando el token del vendedor
                        if (transaction.getProductOfferedId() != null) {
                            System.out.println("Transfiriendo producto ofrecido ID: " + transaction.getProductOfferedId() + " de " + transaction.getSellerId() + " a " + transaction.getBuyerId());
                            ProductDto offeredProduct = productClient.getProduct(transaction.getProductOfferedId());
                            if (offeredProduct == null) {
                                throw new EntityNotFoundException("Offered product not found: " + transaction.getProductOfferedId());
                            }
                            if (!offeredProduct.getOwnerId().equals(String.valueOf(transaction.getSellerId()))) {
                                throw new IllegalArgumentException("Offered product doesn't belong to seller: " + offeredProduct.getOwnerId() + " != " + transaction.getSellerId());
                            }
                            productClient.transferProduct(
                                    transaction.getProductOfferedId(),
                                    transaction.getSellerId(),
                                    transaction.getBuyerId(),
                                    tokens.getSellerToken()
                            );
                        }

                        // Transferencia de producto solicitado (de buyer a seller) usando el token del comprador
                        if (transaction.getProductRequestedId() != null) {
                            System.out.println("Transfiriendo producto solicitado ID: " + transaction.getProductRequestedId() + " de " + transaction.getBuyerId() + " a " + transaction.getSellerId());
                            ProductDto requestedProduct = productClient.getProduct(transaction.getProductRequestedId());
                            if (requestedProduct == null) {
                                throw new EntityNotFoundException("Requested product not found: " + transaction.getProductRequestedId());
                            }
                            if (!requestedProduct.getOwnerId().equals(String.valueOf(transaction.getBuyerId()))) {
                                throw new IllegalArgumentException("Requested product doesn't belong to buyer: " + requestedProduct.getOwnerId() + " != " + transaction.getBuyerId());
                            }
                            productClient.transferProduct(
                                    transaction.getProductRequestedId(),
                                    transaction.getBuyerId(),
                                    transaction.getSellerId(),
                                    tokens.getBuyerToken()
                            );
                        }

                        // Transferencia de créditos ofrecidos (de buyer a seller) usando el token del comprador
                        if (transaction.getCreditsOffered() != null && transaction.getCreditsOffered() > 0) {
                            System.out.println("Transfiriendo créditos ofrecidos: " + transaction.getCreditsOffered() + " de " + transaction.getBuyerId() + " a " + transaction.getSellerId());
                            userClient.transferCredits(
                                    transaction.getBuyerId(),
                                    transaction.getSellerId(),
                                    transaction.getCreditsOffered(),
                                    tokens.getBuyerToken()
                            );
                        }

                        // Transferencia de créditos solicitados (de seller a buyer) usando el token del vendedor
                        if (transaction.getCreditsRequested() != null && transaction.getCreditsRequested() > 0) {
                            System.out.println("Transfiriendo créditos solicitados: " + transaction.getCreditsRequested() + " de " + transaction.getSellerId() + " a " + transaction.getBuyerId());
                            userClient.transferCredits(
                                    transaction.getSellerId(),
                                    transaction.getBuyerId(),
                                    transaction.getCreditsRequested(),
                                    tokens.getSellerToken()
                            );
                        }

                        System.out.println("Transacción ID: " + id + " completada exitosamente");
                    } catch (Exception e) {
                        // Revertir el estado a PENDING si las transferencias fallan
                        transaction.setStatus(Transaction.Status.PENDING);
                        transactionRepository.save(transaction);
                        System.err.println("Error al procesar las transferencias de la transacción ID: " + id + ", mensaje: " + e.getMessage());
                        throw new RuntimeException("Error al completar la transacción: " + e.getMessage(), e);
                    } finally {
                        // Limpiar los tokens después de completar o fallar la transacción
                        removeTransactionTokens(id);
                    }
                } else {
                    System.out.println("Esperando la aceptación del otro usuario para la transacción ID: " + id);
                }
            }

            transaction.setUpdatedAt(LocalDateTime.now());
            Transaction updatedTransaction = transactionRepository.save(transaction);
            System.out.println("Notificando actualización de transacción ID: " + id + " con estado: " + updatedTransaction.getStatus());
            notificationService.notifyTransactionUpdate(
                    transaction.getBuyerId(),
                    transaction.getSellerId(),
                    id,
                    updatedTransaction.getStatus().toString()
            );
            return mapToDto(updatedTransaction);
        } finally {
            transaction.setProcessing(false);
            transactionRepository.save(transaction);
            // Si la transacción fue rechazada, también limpiar los tokens
            if (transaction.getStatus() == Transaction.Status.REJECTED) {
                removeTransactionTokens(id);
            }
        }
    }

    @Override
    public TransactionDto getTransaction(Long id, String authToken) {
        // Validar el token y obtener el ID del usuario
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        // Verificar si el usuario es el comprador o el vendedor
        boolean isBuyer = userInfo.getId().equals(transaction.getBuyerId());
        boolean isSeller = userInfo.getId().equals(transaction.getSellerId());

        if (!isBuyer && !isSeller) {
            throw new IllegalArgumentException("El usuario no es parte de esta transacción");
        }

        return mapToDto(transaction);
    }

    @Override
    public List<TransactionDto> getTransactionsByUser(String authToken) {
        // Validar el token y obtener el ID del usuario
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        Long userId = userInfo.getId();
        List<Transaction> transactions = transactionRepository.findByBuyerIdOrSellerId(userId, userId);
        return transactions.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private TransactionDto mapToDto(Transaction transaction) {
        TransactionDto dto = new TransactionDto();
        dto.setId(transaction.getId());
        dto.setSellerId(transaction.getSellerId());
        dto.setBuyerId(transaction.getBuyerId());
        dto.setProductOfferedId(transaction.getProductOfferedId());
        dto.setProductRequestedId(transaction.getProductRequestedId());
        dto.setCreditsOffered(transaction.getCreditsOffered());
        dto.setCreditsRequested(transaction.getCreditsRequested());
        dto.setStatus(transaction.getStatus().toString());
        dto.setCreatedAt(transaction.getCreatedAt() != null ? transaction.getCreatedAt().format(formatter) : null);
        dto.setUpdatedAt(transaction.getUpdatedAt() != null ? transaction.getUpdatedAt().format(formatter) : null);
        dto.setBuyerAccepted(transaction.isBuyerAccepted());
        dto.setSellerAccepted(transaction.isSellerAccepted());
        return dto;
    }
}