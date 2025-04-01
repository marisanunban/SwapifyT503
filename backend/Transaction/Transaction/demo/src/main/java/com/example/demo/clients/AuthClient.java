package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AuthClient {
    private final WebClient webClient;
    private final ObjectMapper objectMapper; // Añade esto

    public AuthClient(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .baseUrl("http://localhost:8081")
                .build();
        this.objectMapper = objectMapper;
    }

    public Mono<UserInfoDto> validateUserToken(String token, Long id) {
        String uri = "/auth/validate-user" + (id != null ? "?userId=" + id : "");

        return webClient.get()
                .uri(uri)
                .header("Authorization", "Bearer " + token)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(String.class) // Primero obtén como String
                                .flatMap(body -> {
                                    try {
                                        // Debug: imprime la respuesta cruda
                                        System.out.println("Respuesta del auth service: " + body);

                                        // Intenta deserializar
                                        UserInfoDto userInfo = objectMapper.readValue(body, UserInfoDto.class);
                                        return Mono.just(userInfo);
                                    } catch (Exception e) {
                                        System.out.println("Error deserializando respuesta: " + e.getMessage());
                                        return Mono.error(new RuntimeException("Invalid user info format"));
                                    }
                                });
                    } else {
                        return response.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(body -> {
                                    System.out.println("Error del auth service: " + response.statusCode() + " - " + body);
                                    return Mono.error(new RuntimeException("Auth error: " + body));
                                });
                    }
                })
                .doOnNext(user -> System.out.println("Usuario validado: " + user.getId()))
                .doOnError(e -> System.out.println("Error en validación: " + e.getMessage()));
    }
}