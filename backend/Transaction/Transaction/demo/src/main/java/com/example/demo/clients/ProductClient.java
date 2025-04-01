package com.example.demo.clients;

import com.example.demo.dtos.ProductDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class ProductClient {
    private final WebClient webClient;
    private final String baseUrl;

    public ProductClient(
            WebClient.Builder webClientBuilder,
            @Value("${product.service.url}") String baseUrl
    ) {
        this.baseUrl = baseUrl;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    public Mono<ProductDto> getProduct(String productId) {
        return webClient.get()
                .uri("/products/{id}", productId)
                .retrieve()
                .bodyToMono(ProductDto.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error fetching product: " + e.getMessage())));
    }

    public Mono<Void> transferProduct(String productId, Long fromUserId, Long toUserId) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/products/{id}/transfer")
                        .queryParam("fromUserId", fromUserId)
                        .queryParam("toUserId", toUserId)
                        .build(productId))
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error transferring product: " + e.getMessage())));
    }
}