package com.example.demo.services;

import com.example.demo.entities.Users;
import com.example.demo.exceptions.UserNotFoundException;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public Users findByEmail(String email) {
        if (!userRepository.existsByEmail(email)) {
            //Puede que sea EntityNotFoundException
            throw new UserNotFoundException("User not found."); //Todo
        }
        return userRepository.findByEmail(email).get(); // Sabemos que existe por el chequeo previo
    }

    @Override
    public void save(Users user) {
        userRepository.save(user);
    }
}