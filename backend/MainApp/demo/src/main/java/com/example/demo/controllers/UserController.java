package com.example.demo.controllers;

import com.example.demo.dtos.CreditHistoryDto;
import com.example.demo.dtos.CreditRequestDto;
import com.example.demo.dtos.UpdateUserDto;
import com.example.demo.dtos.UserDto;
import com.example.demo.interfaces.CreditHistoryService;
import com.example.demo.interfaces.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private CreditHistoryService creditHistoryService;

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateUser(@PathVariable Long id, @RequestBody UpdateUserDto dto) {
        userService.updateUser(id, dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/credits")
    public ResponseEntity<Void> addCredits(@PathVariable Long id, @RequestBody CreditRequestDto dto) {
        creditHistoryService.addCredits(id, dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/credits/history")
    public List<CreditHistoryDto> getCreditHistory(@PathVariable Long id) {
        return creditHistoryService.getCreditHistory(id);
    }
}