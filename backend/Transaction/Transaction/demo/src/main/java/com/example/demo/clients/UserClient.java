package com.example.demo.clients;

import com.example.demo.dtos.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class UserClient {
    private final WebClient webClient;
    private final String baseUrl;

    public UserClient(
            WebClient.Builder webClientBuilder,
            @Value("${user.service.url}") String baseUrl
    ) {
        this.baseUrl = baseUrl;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    public Mono<UserDto> getUser(Long userId) {
        return webClient.get()
                .uri("/users/{id}", userId)
                .retrieve()
                .bodyToMono(UserDto.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error fetching user: " + e.getMessage())));
    }

    public Mono<Void> transferCredits(Long fromUserId, Long toUserId, int amount) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/users/transfer-credits")
                        .queryParam("fromUserId", fromUserId)
                        .queryParam("toUserId", toUserId)
                        .queryParam("amount", amount)
                        .build())
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error transferring credits: " + e.getMessage())));
    }
}