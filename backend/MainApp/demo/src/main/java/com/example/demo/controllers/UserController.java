package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.*;
import com.example.demo.interfaces.CreditHistoryService;
import com.example.demo.interfaces.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CreditHistoryService creditHistoryService;
    private final AuthClient authClient;

    public UserController(UserService userService, CreditHistoryService creditHistoryService, AuthClient authClient) {
        this.userService = userService;
        this.creditHistoryService = creditHistoryService;
        this.authClient = authClient;
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserDto>> getUser(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        UserInfoDto prueba = authClient.validateUserToken(token.replace("Bearer ", ""), id).block();
        return Mono.just(ResponseEntity.ok(userService.getUser(id)));
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<Void>> updateUser(@PathVariable Long id, @RequestBody UpdateUserDto dto, @RequestHeader("Authorization") String token) {
        return authClient.validateUserToken(token.replace("Bearer ", ""), id)
                .flatMap((UserInfoDto userInfo) -> { // Tipado explícito de userInfo
                    if (!userInfo.getId().equals(id)) {
                        return Mono.<ResponseEntity<Void>>just(ResponseEntity.status(403).build());
                    }
                    userService.updateUser(id, dto);
                    return Mono.<ResponseEntity<Void>>just(ResponseEntity.noContent().build());
                })
                .onErrorResume(Throwable.class, e -> Mono.just(ResponseEntity.status(401).build()));
    }

    @PostMapping("/{id}/credits")
    public Mono<ResponseEntity<Void>> addCredits(@PathVariable Long id, @RequestBody CreditRequestDto dto, @RequestHeader("Authorization") String token) {
        return authClient.validateUserToken(token.replace("Bearer ", ""), id)
                .flatMap((UserInfoDto userInfo) -> { // Tipado explícito de userInfo
                    if (!userInfo.getId().equals(id)) {
                        return Mono.<ResponseEntity<Void>>just(ResponseEntity.status(403).build());
                    }
                    creditHistoryService.addCredits(id, dto);
                    return Mono.<ResponseEntity<Void>>just(ResponseEntity.noContent().build());
                })
                .onErrorResume(Throwable.class, e -> Mono.<ResponseEntity<Void>>just(ResponseEntity.status(401).build()));
    }

    @GetMapping("/{id}/credits/history")
    public Mono<ResponseEntity<List<CreditHistoryDto>>> getCreditHistory(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        return authClient.validateUserToken(token.replace("Bearer ", ""), id)
                .flatMap((UserInfoDto userInfo) -> { // Tipado explícito de userInfo
                    if (!userInfo.getId().equals(id)) {
                        return Mono.<ResponseEntity<List<CreditHistoryDto>>>just(ResponseEntity.status(403).build());
                    }
                    List<CreditHistoryDto> history = creditHistoryService.getCreditHistory(id);
                    return Mono.<ResponseEntity<List<CreditHistoryDto>>>just(ResponseEntity.ok(history));
                })
                .onErrorResume(Throwable.class, e -> Mono.<ResponseEntity<List<CreditHistoryDto>>>just(ResponseEntity.status(401).build()));
    }

    @PostMapping("/create")
    public Mono<ResponseEntity<UserDto>> createUser(@RequestHeader("Authorization") String token) {
        UserInfoDto respuesta = authClient.validateUserToken(token.replace("Bearer ", ""), null).block();
        return Mono.just(new ResponseEntity<>(userService.createUser(respuesta), HttpStatus.CREATED));
    }
}




