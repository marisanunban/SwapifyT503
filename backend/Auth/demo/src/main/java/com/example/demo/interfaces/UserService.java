package com.example.demo.interfaces;

import com.example.demo.entities.Users;

public interface UserService {
    Users findByEmail(String email);
    boolean existsByEmail(String email);
    void save(Users user);
}