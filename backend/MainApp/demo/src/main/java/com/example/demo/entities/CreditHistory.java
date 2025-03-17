package com.example.demo.entities;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class CreditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private int amount; // Positivo para créditos adquiridos, negativo para gastos.

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @PrePersist
    public void setTransactionDate() {
        this.transactionDate = LocalDateTime.now();
    }

    // Getters y Setters
}
