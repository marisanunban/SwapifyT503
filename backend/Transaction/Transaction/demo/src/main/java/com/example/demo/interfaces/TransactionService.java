package com.example.demo.interfaces;

import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UpdateTransactionStatusDto;
import reactor.core.publisher.Mono;

import java.util.List;

public interface TransactionService {
    Mono<TransactionDto> createTransaction(CreateTransactionDto dto, String authToken);
    Mono<TransactionDto> getTransaction(Long id, String authToken);
    Mono<TransactionDto> updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken);
    Mono<List<TransactionDto>> getUserTransactions(String authToken);

}