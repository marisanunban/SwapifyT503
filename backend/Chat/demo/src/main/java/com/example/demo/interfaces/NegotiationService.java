package com.example.demo.interfaces;

import com.example.demo.dtos.ConversationDto;
import com.example.demo.dtos.MessageDto;

import java.util.List;
import java.util.UUID;

public interface NegotiationService {
    ConversationDto startNegotiation(String productId, String authToken);
    MessageDto sendMessage(Long conversationId, String content, String type, String authToken);
    ConversationDto getNegotiation(Long id, String authToken);
    ConversationDto sendProposal(Long id, List<String> productIdsOffered, Integer creditsOffered, String authToken);
    ConversationDto acceptProposal(Long id, String authToken);
}