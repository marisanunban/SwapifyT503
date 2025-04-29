package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ModerationClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.TransactionClient;
import com.example.demo.config.IdGeneratorService;
import com.example.demo.dtos.*;
import com.example.demo.entities.*;
import com.example.demo.interfaces.NegotiationService;
import com.example.demo.repositories.ConversationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    private final ModerationClient moderationClient;


    public NegotiationServiceImpl(
            ConversationRepository conversationRepository,
            AuthClient authClient,
            ProductClient productClient,
            TransactionClient transactionClient,
            SimpMessagingTemplate messagingTemplate,
            IdGeneratorService idGeneratorService,
            ModerationClient moderationClient) {
        this.conversationRepository = conversationRepository;
        this.authClient = authClient;
        this.productClient = productClient;
        this.transactionClient = transactionClient;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.idGeneratorService = idGeneratorService;
        this.moderationClient = moderationClient;
    }

    @Override
    @Transactional
    public ConversationDto startNegotiation(String productId, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        ProductDto product;
        try {
            product = productClient.getProduct(productId);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el producto: " + e.getMessage(), e);
        }
        if (product == null) throw new NoSuchElementException("Producto no encontrado");

        Long buyerId = userInfo.getId();
        Long sellerId = Long.valueOf(product.getOwnerId());

        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("No puedes iniciar una negociaci贸n para tu propio producto");
        }

        Optional<Conversation> existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndProductIdAndStatus(
                        buyerId, sellerId, productId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndStatus(buyerId, sellerId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        Conversation conversation = new Conversation();
        conversation.setId(idGeneratorService.generateSequence("conversation_sequence"));
        conversation.setProductId(productId);
        conversation.setBuyerId(buyerId);
        conversation.setSellerId(sellerId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setCreatedAt(LocalDateTime.now());

        Conversation savedConversation = conversationRepository.save(conversation);
        return mapToDto(savedConversation);
    }

    @Override
    @Transactional
    public MessageDto sendMessage(Long conversationId, String content, String type, String authToken, String productId, Integer creditsOffered) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }

        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar mensajes");
        }

        // Validar producto si se proporciona
        if (productId != null && !productId.isEmpty()) {
            ProductDto product = productClient.getProduct(productId);
            if (product == null || !product.getOwnerId().equals(senderId.toString())) {
                throw new IllegalArgumentException("El producto no existe o no pertenece al remitente");
            }
        }

        // 👉 Revisar contenido ANTES de crear el mensaje
        Boolean isAppropriate = true;
        try {
            isAppropriate = moderationClient.isContentAppropriate(Map.of("content", content));
        } catch (Exception e) {
            System.err.println("Error al verificar contenido: " + e.getMessage());
        }

        if (!Boolean.TRUE.equals(isAppropriate)) {
            // 👉 No se guarda ni se envía el mensaje
            MessageDto warningDto = new MessageDto();
//            warningDto.setContent(content);
            warningDto.setInappropriate(true);
            warningDto.setWarningMessage("El contenido del mensaje es inapropiado y no ha sido enviado.");
            return warningDto;
        }

        // 👉 Solo se crea y guarda si es apropiado
        Message message = new Message();
        message.setId(messageIdGenerator.incrementAndGet());
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setType(MessageType.valueOf(type.toUpperCase()));
        message.setProductId(productId);
        message.setCreditsOffered(creditsOffered != null ? creditsOffered : 0);

        conversation.getMessages().add(message);
        Conversation updatedConversation = conversationRepository.save(conversation);

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
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversaci贸n no encontrada"));

        Long requesterId = userInfo.getId();
        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversaci贸n pueden verla");
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
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversaci贸n no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar propuestas");
        }

        String productId = productIdsOffered != null && !productIdsOffered.isEmpty() ? productIdsOffered.get(0) : null;
        if (productId != null && !productId.isEmpty()) {
            ProductDto product = productClient.getProduct(productId);
            if (product == null || !product.getOwnerId().equals(senderId.toString())) {
                throw new IllegalArgumentException("El producto no existe o no pertenece al remitente");
            }
        }

        String content = "Propuesta: " + (productId != null ? "Producto ID " + productId : "") +
                (creditsOffered != null && creditsOffered > 0 ? ", " + creditsOffered + " cr茅ditos" : "");

        Message message = new Message();
        message.setId(messageIdGenerator.incrementAndGet());
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setType(MessageType.PROPOSAL);
        message.setProductId(productId);
        message.setCreditsOffered(creditsOffered != null ? creditsOffered : 0);

        conversation.getMessages().add(message);
        Conversation updatedConversation = conversationRepository.save(conversation);

        MessageDto dto = mapToMessageDto(message, id);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, dto);
        return mapToDto(updatedConversation);
    }

    @Override
    @Transactional
    public ConversationDto acceptProposal(Long id, String authToken) {
        throw new UnsupportedOperationException("acceptProposal is deprecated. Use transaction status updates.");
    }

    @Override
    public List<ConversationDto> getUserConversations(String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Long userId = userInfo.getId();
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
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversaci贸n no encontrada"));

        Long requesterId = userInfo.getId();
        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversaci贸n pueden eliminarla");
        }

        conversationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TransactionDto createTransaction(Long conversationId, String authToken) {
        System.out.println("Token en NegotiationServiceImpl.createTransaction: " + authToken);

        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversaci贸n no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden crear transacciones");
        }

        // Buscar la propuesta original (PROPOSAL)
        Message proposal = conversation.getMessages().stream()
                .filter(m -> m.getType() == MessageType.PROPOSAL)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("No se encontr贸 una propuesta original"));

        // Buscar la respuesta a la propuesta (PROPOSAL_RESPONSE)
        Message response = conversation.getMessages().stream()
                .filter(m -> m.getType() == MessageType.PROPOSAL_RESPONSE)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("No se encontr贸 una respuesta a la propuesta"));

        Long sellerId = conversation.getSellerId();
        Long buyerId = conversation.getBuyerId();

        CreateTransactionDto transactionDto = new CreateTransactionDto();
        transactionDto.setSellerId(sellerId);
        transactionDto.setBuyerId(buyerId);
        if (proposal.getSenderId().equals(sellerId)) {
            transactionDto.setProductOfferedId(proposal.getProductId());
            transactionDto.setCreditsOffered(proposal.getCreditsOffered());
            transactionDto.setProductRequestedId(response.getProductId());
            transactionDto.setCreditsRequested(response.getCreditsOffered());
        } else {
            transactionDto.setProductOfferedId(response.getProductId());
            transactionDto.setCreditsOffered(response.getCreditsOffered());
            transactionDto.setProductRequestedId(proposal.getProductId());
            transactionDto.setCreditsRequested(proposal.getCreditsOffered());
        }

        TransactionDto createdTransaction = transactionClient.createTransaction(transactionDto, authToken);

        Message systemMessage = new Message();
        systemMessage.setId(messageIdGenerator.incrementAndGet());
        systemMessage.setContent("Transacci贸n creada con ID: " + createdTransaction.getId());
        systemMessage.setTimestamp(LocalDateTime.now());
        systemMessage.setType(MessageType.SYSTEM);
        conversation.getMessages().add(systemMessage);
        conversationRepository.save(conversation);

        MessageDto systemMessageDto = mapToMessageDto(systemMessage, conversationId);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, systemMessageDto);

        return createdTransaction;
    }

    @Override
    @Transactional
    public TransactionDto confirmTransaction(Long conversationId, Long transactionId, String authToken, boolean accept) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inv谩lido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversaci贸n no encontrada"));

        Long userId = userInfo.getId();
        if (!userId.equals(conversation.getBuyerId()) && !userId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden confirmar transacciones");
        }

        // Crear el DTO para actualizar el estado
        UpdateTransactionStatusDto statusDto = new UpdateTransactionStatusDto();
        statusDto.setStatus(accept ? "ACCEPTED" : "REJECTED");

        // Actualizar el estado de la transacci贸n
        TransactionDto updatedTransaction = transactionClient.updateTransactionStatus(transactionId, statusDto, authToken);

        Message systemMessage = new Message();
        systemMessage.setId(messageIdGenerator.incrementAndGet());
        systemMessage.setContent(accept ?
                "Usuario " + userId + " ha aceptado la transacci贸n " + transactionId :
                "Usuario " + userId + " ha rechazado la transacci贸n " + transactionId);
        systemMessage.setTimestamp(LocalDateTime.now());
        systemMessage.setType(MessageType.SYSTEM);
        conversation.getMessages().add(systemMessage);
        conversationRepository.save(conversation);

        MessageDto systemMessageDto = mapToMessageDto(systemMessage, conversationId);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, systemMessageDto);

        return updatedTransaction;
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
                m.getProductId(),
                m.getCreditsOffered(),
                m.isInappropriate(),
                m.getWarningMessage()
        );
    }

}