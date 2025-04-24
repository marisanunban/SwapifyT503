package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserClient {

    private final WebClient webClient;

    String userServiceUrl = "http://localhost:8082";
    public UserClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(userServiceUrl).build();
    }

    public List<Long> getUserIdsByLocation(String location) {
        List<UserInfoDto> users = webClient.get()
                .uri(userServiceUrl + "/api/users/get-by-location/{location}", location)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<UserInfoDto>>() {})
                .block();

        return users.stream()
                .map(UserInfoDto::getId)
                .collect(Collectors.toList());
    }
}