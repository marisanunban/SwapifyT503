package com.example.demo.clients;

import com.example.demo.dtos.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "user-service", url = "${user.service.url}")
public interface UserClient {
    @GetMapping("/{id}")
    UserDto getUser(
            @PathVariable("id") Long userId,
            @RequestHeader("Authorization") String token
    );

    @GetMapping("/by-email")
    UserDto getUserByEmail(
            @RequestParam("email") String email,
            @RequestHeader("Authorization") String token
    );

    @PostMapping("/transfer-credits")
    void transferCredits(
            @RequestParam("fromUserId") Long fromUserId,
            @RequestParam("toUserId") Long toUserId,
            @RequestParam("amount") int amount,
            @RequestHeader("Authorization") String token
    );
}