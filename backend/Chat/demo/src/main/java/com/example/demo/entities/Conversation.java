package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Conversation {
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    public String getProposalProductIds() {
        return proposalProductIds;
    }

    public void setProposalProductIds(String proposalProductIds) {
        this.proposalProductIds = proposalProductIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getProposalCreditsOffered() {
        return proposalCreditsOffered;
    }

    public void setProposalCreditsOffered(Integer proposalCreditsOffered) {
        this.proposalCreditsOffered = proposalCreditsOffered;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
        this.status = status;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private String productId;

    @Column(name = "buyer_id")
    private Long buyerId; // Cambiado de UUID a Long

    @Column(name = "seller_id")
    private Long sellerId; // Cambiado de UUID a Long

    @Enumerated(EnumType.STRING)
    private ConversationStatus status;

    @Column(columnDefinition = "TEXT")
    private String proposalProductIds;

    private Integer proposalCreditsOffered;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL)
    private List<Message> messages = new ArrayList<>();
}