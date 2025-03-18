package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AuthClient {
    private final WebClient webClient;

    public AuthClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://auth-service").build();
    }

    public Mono<UserInfoDto> validateToken(String token) {
        return webClient.get()
                .uri("/auth/me")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(UserInfoDto.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error validando token: " + e.getMessage())));
    }
}