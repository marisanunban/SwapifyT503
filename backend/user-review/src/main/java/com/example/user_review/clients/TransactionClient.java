package com.example.user_review.clients;

import com.example.user_review.DTOs.TransactionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class TransactionClient {

    @Autowired
    private RestTemplate restTemplate;

    @Value("http://localhost:8084")
    private String transactionServiceUrl;



    public List<TransactionDto> checkCompletedTransaction(Long userA, Long userB) {
        String url = transactionServiceUrl + "/transactions/completed/full?userA=" + userA + "&userB=" + userB;

        try {
            ResponseEntity<TransactionDto[]> response = restTemplate.getForEntity(url, TransactionDto[].class);

            TransactionDto[] transactions = response.getBody();
            if (transactions != null) {
                System.out.println("Transacciones recibidas: " + transactions.length);
                for (TransactionDto t : transactions) {
                    System.out.println("ID: " + t.getId() + ", Buyer: " + t.getBuyerId() + ", Seller: " + t.getSellerId());
                }
                return Arrays.asList(transactions);
            } else {
                System.out.println("Respuesta vacía del servicio de transacciones.");
                return Collections.emptyList();
            }

        } catch (Exception e) {
            e.printStackTrace(); // para debugging
            return Collections.emptyList();
        }
    }

    // Clase interna o externa para mapear la respuesta
    public static class CompletedTransactionResponse {
        private boolean hasCompletedTransaction;
        private List<Long> transactionIds;

        public boolean isHasCompletedTransaction() {
            return hasCompletedTransaction;
        }

        public void setHasCompletedTransaction(boolean hasCompletedTransaction) {
            this.hasCompletedTransaction = hasCompletedTransaction;
        }

        public List<Long> getTransactionIds() {
            return transactionIds;
        }

        public void setTransactionIds(List<Long> transactionIds) {
            this.transactionIds = transactionIds;
        }
    }
}
