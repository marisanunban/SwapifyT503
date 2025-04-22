package com.example.demo.services;

import com.example.demo.clients.AuthClient;
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
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

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
            throw new IllegalArgumentException("No puedes iniciar una negociación para tu propio producto");
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
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
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

        // Si es PROPOSAL_RESPONSE, crear una transacción
        if (message.getType() == MessageType.PROPOSAL_RESPONSE) {
            // Buscar la propuesta original (el último mensaje PROPOSAL)
            Message originalProposal = conversation.getMessages().stream()
                    .filter(m -> m.getType() == MessageType.PROPOSAL)
                    .reduce((first, second) -> second) // Obtener el último
                    .orElseThrow(() -> new IllegalStateException("No se encontró una propuesta original"));

            CreateTransactionDto transactionDto = new CreateTransactionDto();
            // Producto ofrecido por el vendedor (de la propuesta original)
            transactionDto.setProductOfferedId(originalProposal.getProductId());
            transactionDto.setCreditsOffered(originalProposal.getCreditsOffered());

            TransactionDto createdTransaction = transactionClient.createTransaction(transactionDto, authToken);

            // Enviar mensaje de sistema notificando la transacción
            Message systemMessage = new Message();
            systemMessage.setId(messageIdGenerator.incrementAndGet());
            systemMessage.setContent("Transacción creada con ID: " + createdTransaction.getId());
            systemMessage.setTimestamp(LocalDateTime.now());
            systemMessage.setType(MessageType.SYSTEM);
            conversation.getMessages().add(systemMessage);
            conversationRepository.save(conversation);

            MessageDto systemMessageDto = mapToMessageDto(systemMessage, conversationId);
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, systemMessageDto);
        }

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        return dto;
    }

    @Override
    public ConversationDto getNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId = userInfo.getId();
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
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar propuestas");
        }

        String productId = productIdsOffered != null && !productIdsOffered.isEmpty() ? productIdsOffered.get(0) : null;
        String content = "Propuesta: " + (productId != null ? "Producto ID " + productId : "") +
                (creditsOffered != null && creditsOffered > 0 ? ", " + creditsOffered + " créditos" : "");

        return mapToDto(conversationRepository.save(conversation));
    }

    @Override
    @Transactional
    public ConversationDto acceptProposal(Long id, String authToken) {
        // Este método ya no se usa en el flujo propuesto, pero lo mantenemos por compatibilidad
        throw new UnsupportedOperationException("acceptProposal is deprecated. Use transaction status updates.");
    }

    @Override
    public List<ConversationDto> getUserConversations(String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Long userId = userInfo.getId();
        List<Conversation> conversations = conversationRepository.findByBuyerIdOrSellerId(userId);
        return conversations.stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional
    public void deleteNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null); // Corregido: no eliminar "Bearer "
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId = userInfo.getId();
        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversación pueden eliminarla");
        }

        conversationRepository.deleteById(id);
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
                m.getCreditsOffered()
        );
    }
}