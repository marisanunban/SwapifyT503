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

@CrossOrigin(origins = "http://localhost:4200") // TODO: Implementar archivo de seguridad y quitar esta etiqueta
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
        UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", ""), id).block();
        return Mono.just(ResponseEntity.ok(userService.getUser(id)));
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<Void>> updateUser(@PathVariable Long id, @RequestBody UpdateUserDto dto, @RequestHeader("Authorization") String token) {
        authClient.validateUserToken(token.replace("Bearer ", ""), id).block();
        userService.updateUser(id, dto);
        return Mono.just(ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/credits")
    public Mono<ResponseEntity<Void>> addCredits(@PathVariable Long id, @RequestBody CreditRequestDto dto, @RequestHeader("Authorization") String token) {
        authClient.validateUserToken(token.replace("Bearer ", ""), id).block();
        creditHistoryService.addCredits(id, dto);
        return Mono.just(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/credits/history")
    public Mono<ResponseEntity<List<CreditHistoryDto>>> getCreditHistory(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        authClient.validateUserToken(token.replace("Bearer ", ""), id).block();
        List<CreditHistoryDto> history = creditHistoryService.getCreditHistory(id);
        return Mono.just(ResponseEntity.ok(history));
    }

    @PostMapping("/create")
    public Mono<ResponseEntity<UserDto>> createUser(@RequestHeader("Authorization") String token) {
        UserInfoDto respuesta = authClient.validateUserToken(token.replace("Bearer ", ""), null).block();
        return Mono.just(new ResponseEntity<>(userService.createUser(respuesta), HttpStatus.CREATED));
    }
}




