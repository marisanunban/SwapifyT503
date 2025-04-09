package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.TransactionClient;
import com.example.demo.dtos.*;
import com.example.demo.entities.*;
import com.example.demo.interfaces.NegotiationService;
import com.example.demo.repositories.ConversationRepository;
import com.example.demo.repositories.MessageRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NegotiationServiceImpl implements NegotiationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;
    private final TransactionClient transactionClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper; // Añadido para deserializar proposalProductIds

    public NegotiationServiceImpl(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            AuthClient authClient,
            ProductClient productClient,
            TransactionClient transactionClient,
            SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.authClient = authClient;
        this.productClient = productClient;
        this.transactionClient = transactionClient;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper(); // Inicializado aquí
    }

    @Override
    @Transactional
    public ConversationDto startNegotiation(String productId, String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) throw new EntityNotFoundException("Token inválido");

        ProductDto product = productClient.getProduct(productId);
        if (product == null) throw new EntityNotFoundException("Producto no encontrado");

        Long buyerId = Long.valueOf(userInfo.getId().toString());
        Long sellerId = Long.valueOf(product.getOwnerId());

        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("No puedes iniciar una negociación para tu propio producto");
        }

        Conversation conversation = new Conversation();
        conversation.setProductId(productId);
        conversation.setBuyerId(buyerId);
        conversation.setSellerId(sellerId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setCreatedAt(LocalDateTime.now());

        return mapToDto(conversationRepository.save(conversation));
    }

    @Override
    @Transactional
    public MessageDto sendMessage(Long conversationId, String content, String type, String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) throw new EntityNotFoundException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada"));

        Long senderId = Long.valueOf(userInfo.getId().toString());
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo participantes pueden enviar mensajes");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setType(MessageType.valueOf(type.toUpperCase()));

        Message saved = messageRepository.save(message);
        MessageDto dto = mapToMessageDto(saved);

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        return dto;
    }

    @Override
    public ConversationDto getNegotiation(Long id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada"));
        return mapToDto(conversation);
    }

    @Override
    @Transactional
    public ConversationDto sendProposal(Long id, List<String> productIdsOffered, Integer creditsOffered, String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) throw new EntityNotFoundException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada"));

        Long buyerId = Long.valueOf(userInfo.getId().toString());
        if (!buyerId.equals(conversation.getBuyerId())) {
            throw new IllegalArgumentException("Solo el comprador puede enviar propuestas");
        }

        try {
            if (productIdsOffered != null && !productIdsOffered.isEmpty()) {
                conversation.setProposalProductIds(objectMapper.writeValueAsString(productIdsOffered));
            } else {
                conversation.setProposalProductIds(null);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Error al serializar productIdsOffered", e);
        }
        conversation.setProposalCreditsOffered(creditsOffered);
        conversation.setStatus(ConversationStatus.PROPOSAL_SENT);

        Conversation updated = conversationRepository.save(conversation);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public ConversationDto acceptProposal(Long id, String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) throw new EntityNotFoundException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada"));

        Long sellerId = Long.valueOf(userInfo.getId().toString()); // Corregido de UUID a Long
        if (!sellerId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo el vendedor puede aceptar propuestas");
        }

        if (!conversation.getStatus().equals(ConversationStatus.PROPOSAL_SENT)) {
            throw new IllegalStateException("No hay una propuesta pendiente para aceptar");
        }

        // Crear la transacción
        CreateTransactionDto transactionDto = new CreateTransactionDto();
        transactionDto.setProductOfferedId(conversation.getProductId());
        transactionDto.setCreditsOffered(conversation.getProposalCreditsOffered() != null ? conversation.getProposalCreditsOffered() : 0);
        TransactionDto createdTransaction = transactionClient.createTransaction(transactionDto, authToken);

        // Actualizar la transacción con los productos ofrecidos por el comprador y aceptarla
        UpdateTransactionStatusDto statusDto = new UpdateTransactionStatusDto();
        statusDto.setStatus("PENDING"); // Primero el comprador confirma con los productos ofrecidos
        String proposalProductIds = conversation.getProposalProductIds();
        if (proposalProductIds != null && !proposalProductIds.isEmpty()) {
            try {
                List<String> productIds = objectMapper.readValue(proposalProductIds, List.class);
                if (!productIds.isEmpty()) {
                    statusDto.setProductRequestedId(productIds.get(0)); // Asumimos un solo producto por simplicidad
                }
            } catch (Exception e) {
                throw new IllegalStateException("Error al deserializar proposalProductIds", e);
            }
        }
        transactionClient.updateTransactionStatus(createdTransaction.getId(), statusDto, authToken);

        // El vendedor acepta la transacción
        statusDto.setStatus("ACCEPTED");
        TransactionDto acceptedTransaction = transactionClient.updateTransactionStatus(createdTransaction.getId(), statusDto, authToken);

        // Verificar que la transacción se completó
        if (!"COMPLETED".equals(acceptedTransaction.getStatus())) {
            throw new IllegalStateException("La transacción no se completó correctamente");
        }

        // Cerrar la conversación
        conversation.setStatus(ConversationStatus.CLOSED);
        Conversation updated = conversationRepository.save(conversation);

        ConversationDto dto = mapToDto(updated);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, dto);

        return dto;
    }

    private ConversationDto mapToDto(Conversation c) {
        return new ConversationDto(
                c.getId(),
                c.getProductId(),
                c.getBuyerId(),
                c.getSellerId(),
                c.getMessages().stream().map(this::mapToMessageDto).toList(),
                c.getStatus().toString(),
                c.getProposalProductIds(),
                c.getProposalCreditsOffered(),
                c.getCreatedAt().toString()
        );
    }

    private MessageDto mapToMessageDto(Message m) {
        return new MessageDto(
                m.getId(),
                m.getConversation().getId(),
                m.getSenderId(),
                m.getContent(),
                m.getTimestamp().toString(),
                m.getType().toString()
        );
    }
}