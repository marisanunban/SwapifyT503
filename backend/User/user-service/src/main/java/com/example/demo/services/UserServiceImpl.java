package com.example.demo.services;

import com.example.demo.dtos.*;
import com.example.demo.entities.User;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public UserProfileDto getUserEntity(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getUsermail(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getLocationName() != null ? user.getLocationName() : "",
                user.getLatitude(),
                user.getLongitude(),
                user.getNickname(),
                user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "",
                user.getProfilePictureId() != null ? user.getProfilePictureId() : ""


        );
    }

    @Override
    public void updateUser(Long id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setUsermail(dto.getUsername());
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
        // Verificar si el usuario ya existe por email
        Optional<User> existingUser = userRepository.findByUsername(userInfoDto.getUseremail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
        }

        // Crear un nuevo usuario usando el ID del servicio de autenticación
        User user = new User();
        user.setId(userInfoDto.getId()); // Establecer el ID del token (ej. "16")
        user.setUsermail(userInfoDto.getUseremail()); // Usar el email como username
        user.setCredits(100); // Créditos iniciales
        user.setUpdatedAt(LocalDateTime.now());
        user.setProfilePictureId(userInfoDto.getImageId());

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error creando usuario: " + e.getMessage());
        }

        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public void updateUserProfile(Long id, UpdateUserProfileDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (dto.getAboutMe() != null) {
            user.setAboutMe(dto.getAboutMe());
        }
        if (dto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(dto.getProfilePictureUrl());
        }
        if(dto.getProfilePictureId() != null){
            user.setProfilePictureId(dto.getProfilePictureId());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    @Override
    public void transferCredits(Long fromUserId, Long toUserId, int amount) {
        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("Usuario origen no encontrado: " + fromUserId));
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("Usuario destino no encontrado: " + toUserId));

        if (fromUser.getCredits() < amount) {
            throw new RuntimeException("Créditos insuficientes para el usuario: " + fromUserId);
        }

        fromUser.setCredits(fromUser.getCredits() - amount);
        toUser.setCredits(toUser.getCredits() + amount);

        userRepository.save(fromUser);
        userRepository.save(toUser);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByUsername(email) // O findByEmail si tienes ese método
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public UserProfileDto getUserProfile(Long id) {
        UserProfileDto userProfile = getUserEntity(id);
        return new UserProfileDto(
                userProfile.getId(),
                userProfile.getUsermail(),
                userProfile.getAboutMe() != null ? userProfile.getAboutMe() : "",
                userProfile.getLocationName() != null ? userProfile.getLocationName() : "",
                userProfile.getLatitude(),
                userProfile.getLongitude(),
                userProfile.getNickname(),
                userProfile.getProfilePictureUrl() != null ? userProfile.getProfilePictureUrl() : "",
                userProfile.getProfilePictureId() != null ? userProfile.getProfilePictureId() : ""


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
                user.getUsermail(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getLocationName() != null ? user.getLocationName() : "",
                user.getLatitude(),
                user.getLongitude(),
                user.getNickname(),
                user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "",
                user.getProfilePictureId() != null ? user.getProfilePictureId() : ""


        );
    }

    @Override
    public User updateLocation(Long userId, Double latitude, Double longitude, String locationName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setLatitude(latitude);
        user.setLongitude(longitude);
        user.setLocationName(locationName);
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    @Override
    public List<User> getUsersByLocation(String locationName) {
        List<User> users = new ArrayList<>();
        users = userRepository.findByLocationName(locationName);
        return users;
    }


}