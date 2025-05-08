package com.example.demo.serviceImplTests;

import com.example.demo.entities.Users;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.UserServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private Users user;

    @BeforeEach
    void setUp() {
        user = new Users();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("password");
    }

    @Test
    void findByEmail_UserExists_ShouldReturnUser() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        Users foundUser = userService.findByEmail("test@example.com");

        assertNotNull(foundUser);
        assertEquals("test@example.com", foundUser.getEmail());
    }

    @Test
    void findByEmail_UserDoesNotExist_ShouldThrowException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> userService.findByEmail("test@example.com"));
    }

    @Test
    void save_ShouldCallRepositorySave() {
        userService.save(user);

        verify(userRepository, times(1)).save(user);
    }
}
