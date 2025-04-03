package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {
    @Id
    @GeneratedValue
    private Long id;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "seller_email", nullable = false) // Nuevo campo
    private String sellerEmail;

    @Column(name = "product_offered_id")
    private String productOfferedId;  // Nullable (para trueques con créditos)

    @Column(name = "product_requested_id", nullable = false)
    private String productRequestedId;

    @Column(name = "credits_offered", nullable = false)
    private Integer creditsOffered = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        PENDING, ACCEPTED, REJECTED, COMPLETED
    }

    // Getters y setters existentes
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Status getStatus() {
        return status;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    // Getter y setter para el nuevo campo
    public String getSellerEmail() {
        return sellerEmail;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }
}