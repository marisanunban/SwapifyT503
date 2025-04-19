package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.TransactionClient;
import com.example.demo.config.IdGeneratorService;
import com.example.demo.dtos.*;
import com.example.demo.entities.*;
import com.example.demo.interfaces.NegotiationService;
import com.example.demo.repositories.ConversationRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class NegotiationServiceImpl implements NegotiationService {
    private final ConversationRepository conversationRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;
    private final TransactionClient transactionClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final IdGeneratorService idGeneratorService;
    private final AtomicLong messageIdGenerator = new AtomicLong(System.currentTimeMillis());

    public NegotiationServiceImpl(
            ConversationRepository conversationRepository,
            AuthClient authClient,
            ProductClient productClient,
            TransactionClient transactionClient,
            SimpMessagingTemplate messagingTemplate,
            IdGeneratorService idGeneratorService) {
        this.conversationRepository = conversationRepository;
        this.authClient = authClient;
        this.productClient = productClient;
        this.transactionClient = transactionClient;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.idGeneratorService = idGeneratorService;
    }

    @Override
    @Transactional
    public ConversationDto startNegotiation(String productId, String authToken) {
        // Validar el token
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        // Obtener el producto
        ProductDto product;
        try {
            product = productClient.getProduct(productId);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el producto: " + e.getMessage(), e);
        }
        if (product == null) throw new NoSuchElementException("Producto no encontrado");

        // Convertir IDs
        Long buyerId;
        try {
            buyerId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        Long sellerId;
        try {
            sellerId = Long.valueOf(product.getOwnerId());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de propietario inválido: " + product.getOwnerId());
        }

        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("No puedes iniciar una negociación para tu propio producto");
        }

        // Verificar si ya existe una conversación activa para este producto
        Optional<Conversation> existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndProductIdAndStatus(
                        buyerId, sellerId, productId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        // Verificar si ya existe una conversación activa entre buyerId y sellerId
        existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndStatus(buyerId, sellerId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        // Crear nueva conversación
        Conversation conversation = new Conversation();
        conversation.setId(idGeneratorService.generateSequence("conversation_sequence"));
        conversation.setProductId(productId);
        conversation.setBuyerId(buyerId);
        conversation.setSellerId(sellerId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setCreatedAt(LocalDateTime.now());

        // Guardar la conversación
        try {
            Conversation savedConversation = conversationRepository.save(conversation);
            return mapToDto(savedConversation);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la conversación: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public MessageDto sendMessage(Long conversationId, String content, String type, String authToken, String productId) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId;
        try {
            senderId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar mensajes");
        }

        Message message = new Message();
        message.setId(messageIdGenerator.incrementAndGet());
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        try {
            message.setType(MessageType.valueOf(type.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo de mensaje inválido: " + type);
        }
        message.setProductId(productId);

        conversation.getMessages().add(message);
        Conversation updatedConversation;
        try {
            updatedConversation = conversationRepository.save(conversation);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar el mensaje: " + e.getMessage(), e);
        }

        Message savedMessage = updatedConversation.getMessages().stream()
                .filter(m -> m.getId().equals(message.getId()))
                .findFirst()
                .orElse(message);

        MessageDto dto = mapToMessageDto(savedMessage, conversationId);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        return dto;
    }

    @Override
    public ConversationDto getNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId;
        try {
            requesterId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversación pueden verla");
        }

        return mapToDto(conversation);
    }

    @Override
    @Transactional
    public ConversationDto sendProposal(Long id, List<String> productIdsOffered, Integer creditsOffered, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long buyerId;
        try {
            buyerId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

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
            throw new RuntimeException("Error al serializar productIdsOffered: " + e.getMessage(), e);
        }
        conversation.setProposalCreditsOffered(creditsOffered);
        conversation.setStatus(ConversationStatus.PROPOSAL_SENT);

        Conversation updated;
        try {
            updated = conversationRepository.save(conversation);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la propuesta: " + e.getMessage(), e);
        }
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public ConversationDto acceptProposal(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long sellerId;
        try {
            sellerId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        if (!sellerId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo el vendedor puede aceptar propuestas");
        }

        if (!conversation.getStatus().equals(ConversationStatus.PROPOSAL_SENT)) {
            throw new IllegalStateException("No hay una propuesta pendiente para aceptar");
        }

        CreateTransactionDto transactionDto = new CreateTransactionDto();
        transactionDto.setProductOfferedId(conversation.getProductId());
        transactionDto.setCreditsOffered(conversation.getProposalCreditsOffered() != null ? conversation.getProposalCreditsOffered() : 0);

        TransactionDto createdTransaction;
        try {
            createdTransaction = transactionClient.createTransaction(transactionDto, authToken);
        } catch (Exception e) {
            throw new RuntimeException("Error al crear la transacción: " + e.getMessage(), e);
        }

        conversation.setStatus(ConversationStatus.ACTIVE);
        Conversation updated;
        try {
            updated = conversationRepository.save(conversation);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la conversación: " + e.getMessage(), e);
        }

        ConversationDto dto = mapToDto(updated);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, dto);
        messagingTemplate.convertAndSend("/topic/users/" + conversation.getBuyerId(),
                "Por favor, confirma la transacción " + createdTransaction.getId() + " con tu producto.");

        return dto;
    }

    @Override
    public List<ConversationDto> getUserConversations(String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Long userId;
        try {
            userId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        List<Conversation> conversations = conversationRepository.findByBuyerIdOrSellerId(userId);
        return conversations.stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional
    public void deleteNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId;
        try {
            requesterId = Long.valueOf(userInfo.getId().toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de usuario inválido: " + userInfo.getId());
        }

        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversación pueden eliminarla");
        }

        try {
            conversationRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la conversación: " + e.getMessage(), e);
        }
    }

    private ConversationDto mapToDto(Conversation c) {
        return new ConversationDto(
                c.getId(),
                c.getProductId(),
                c.getBuyerId(),
                c.getSellerId(),
                c.getMessages().stream().map(m -> mapToMessageDto(m, c.getId())).toList(),
                c.getStatus().toString(),
                c.getProposalProductIds(),
                c.getProposalCreditsOffered(),
                c.getCreatedAt().toString()
        );
    }

    private MessageDto mapToMessageDto(Message m, Long conversationId) {
        return new MessageDto(
                m.getId(),
                conversationId,
                m.getSenderId(),
                m.getContent(),
                m.getTimestamp().toString(),
                m.getType().toString(),
                m.getProductId()
        );
    }

    private Long generateMessageId() {
        return messageIdGenerator.incrementAndGet();
    }
}