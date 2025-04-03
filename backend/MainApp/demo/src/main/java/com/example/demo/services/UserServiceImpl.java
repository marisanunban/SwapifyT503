package com.example.demo.services;

import com.example.demo.dtos.*;
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
    public UserProfileDto getUserEntity(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getProfilePicture() != null ? user.getProfilePicture() : ""
        );
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

    @Override
    public UserDto createUser(UserInfoDto userInfoDto) {
        Optional<User> existingUser = userRepository.findByUsername(userInfoDto.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            return new UserDto(user.getId(), user.getUsername(), user.getCredits());
        }
        User user = new User();
        user.setUsername(userInfoDto.getEmail());
        user.setCredits(100);
        user.setUpdatedAt(LocalDateTime.now());

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error creando usuario: " + e.getMessage());
        }

        return new UserDto(user.getId(), user.getUsername(), user.getCredits());
    }

    @Override
    public void updateUserProfile(Long id, UpdateUserProfileDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (dto.getAboutMe() != null) {
            user.setAboutMe(dto.getAboutMe());
        }
        if (dto.getProfilePicture() != null) {
            user.setProfilePicture(dto.getProfilePicture());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByUsername(email)  // O findByEmail si tienes ese método
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return new UserDto(user.getId(), user.getUsername(), user.getCredits());
    }

    @Override
    public UserProfileDto getUserProfile(Long id) {
        UserProfileDto userProfile = getUserEntity(id);
        return new UserProfileDto(
                userProfile.getId(),
                userProfile.getUsername(),
                userProfile.getAboutMe() != null ? userProfile.getAboutMe() : "",
                userProfile.getProfilePicture() != null ? userProfile.getProfilePicture() : ""
        );
    }

    @Override
    public void updateUserProfileReactively(Long id, UpdateUserProfileDto dto) {
        updateUserProfile(id, dto);
    }

    @Override
    public UserProfileDto getUserProfileByEmail(String email) {
        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getProfilePicture() != null ? user.getProfilePicture() : ""
        );
    }
}