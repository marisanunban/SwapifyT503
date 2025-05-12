package com.example.user_review.clients;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class TransactionClient {

    @Autowired
    private RestTemplate restTemplate;

    @Value("http://localhost:8084")
    private String transactionServiceUrl;

    public boolean hasCompletedTransaction(Long userA, Long userB) {
        String url = transactionServiceUrl + "/api/transactions/completed?userA=" + userA + "&userB=" + userB;

        try {
            ResponseEntity<CompletedTransactionResponse> response =
                    restTemplate.getForEntity(url, CompletedTransactionResponse.class);

            return response.getBody() != null && response.getBody().isHasCompletedTransaction();
        } catch (Exception e) {
            // Manejar fallos o loggear
            return false;
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
