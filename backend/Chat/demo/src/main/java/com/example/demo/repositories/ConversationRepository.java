package com.example.demo.repositories;

import com.example.demo.entities.Conversation;
import com.example.demo.entities.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByProductIdAndStatus(String productId, ConversationStatus status);
}