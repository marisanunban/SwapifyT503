package com.example.demo.services;

import com.example.demo.entities.Users;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private  UserRepository userRepository;

    @Override
    public Users findByEmail(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new EntityNotFoundException("User not found.");
        }
        return userRepository.findByEmail(email).get();
    }

    @Override
    public void save(Users user) {
        userRepository.save(user);
    }
}