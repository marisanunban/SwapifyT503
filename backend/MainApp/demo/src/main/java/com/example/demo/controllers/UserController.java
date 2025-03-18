package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.CreditRequestDto;
import com.example.demo.dtos.UpdateUserDto;
import com.example.demo.interfaces.CreditHistoryService;
import com.example.demo.interfaces.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/users")
public class UserController {

    private final AuthClient authClient;
    private final UserService userService;
    private final CreditHistoryService creditHistoryService;

    public UserController(AuthClient authClient, UserService userService, CreditHistoryService creditHistoryService) {
        this.authClient = authClient;
        this.userService = userService;
        this.creditHistoryService = creditHistoryService;
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<Void>> updateUser(@PathVariable Long id, @RequestBody UpdateUserDto dto, @RequestHeader("Authorization") String token) {
        return authClient.validateToken(token.replace("Bearer ", ""))
                .flatMap(userInfo -> {
                    if (!userInfo.getId().equals(id)) {
                        return Mono.just(ResponseEntity.<Void>status(403).build());
                    }
                    userService.updateUser(id, dto);
                    return Mono.just(ResponseEntity.noContent().build());
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.<Void>status(401).build()));
    }

    @PostMapping("/{id}/credits")
    public Mono<ResponseEntity<Void>> addCredits(@PathVariable Long id, @RequestBody CreditRequestDto dto, @RequestHeader("Authorization") String token) {
        return authClient.validateToken(token.replace("Bearer ", ""))
                .flatMap(userInfo -> {
                    if (!userInfo.getId().equals(id)) {
                        return Mono.just(ResponseEntity.<Void>status(403).build());
                    }
                    creditHistoryService.addCredits(id, dto);
                    return Mono.just(ResponseEntity.noContent().build());
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.<Void>status(401).build()));
    }
}