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
public class    UserController {

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
    @GetMapping("/me")
    public Mono<ResponseEntity<UserProfileDto>> getCurrentUserProfile(@RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", ""), null).block();
            if (userInfo == null || userInfo.getEmail() == null) {
                return Mono.just(ResponseEntity.status(401).build());
            }
            UserProfileDto profileDto = userService.getUserProfileByEmail(userInfo.getEmail());
            return Mono.just(ResponseEntity.ok(profileDto));
        } catch (Exception e) {
            System.out.println("Excepción al obtener el perfil: " + e.getMessage());
            return Mono.just(ResponseEntity.status(401).build());
        }
    }
        @GetMapping("/by-email")
        public ResponseEntity<UserDto> getUserByEmail(
                @RequestParam String email,
                @RequestHeader("Authorization") String token) {
            try {
                // 1. Validar el token
                UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", ""), null).block();

                if (userInfo == null || !userInfo.getEmail().equals(email)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }

                // 2. Obtener el usuario por email
                UserDto user = userService.getUserByEmail(email);
                return ResponseEntity.ok(user);

            } catch (Exception e) {
                // 3. Manejo de errores
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

    @PatchMapping("/me")
    public Mono<ResponseEntity<Void>> updateCurrentUserProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody UpdateUserProfileDto dto) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", ""), null).block();
            if (userInfo == null || userInfo.getEmail() == null) {
                return Mono.just(ResponseEntity.status(401).build());
            }
            // Buscar el usuario por email para obtener su ID
            UserProfileDto userProfile = userService.getUserProfileByEmail(userInfo.getEmail());
            userService.updateUserProfileReactively(userProfile.getId(), dto);
            return Mono.just(ResponseEntity.noContent().build());
        } catch (Exception e) {
            System.out.println("Excepción al actualizar el perfil: " + e.getMessage());
            return Mono.just(ResponseEntity.status(401).build());
        }
    }
}




