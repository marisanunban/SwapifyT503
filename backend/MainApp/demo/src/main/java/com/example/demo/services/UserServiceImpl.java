package com.example.demo.services;

import com.example.demo.dtos.CreateUserDto;
import com.example.demo.dtos.UpdateUserDto;
import com.example.demo.dtos.UserDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.User;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return new UserDto(user.getId(), user.getUsername(), user.getCredits());
    }

    @Override
    public void updateUser(Long id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setUsername(dto.getUsername());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void updateCredits(Long id, int amount) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setCredits(user.getCredits() + amount);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public UserDto createUser(UserInfoDto userInfoDto) {
        Optional<User> existingUser = userRepository.findByUsername(userInfoDto.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            return new UserDto(user.getId(), user.getUsername(), user.getCredits());
        }

        User user = new User(); // Establecemos el ID del auth-service
        user.setUsername(userInfoDto.getEmail());
        user.setCredits(100);
        user.setUpdatedAt(LocalDateTime.now());

        // No es necesario el try-catch, Spring lo maneja automáticamente
        user = userRepository.save(user);

        return new UserDto(user.getId(), user.getUsername(), user.getCredits());
    }

    //todo hacer metodo para ver /me obtener usuario que esta logueado con token en vez de crear devolver
    //comprobar que no se cree cuando ya esta
}