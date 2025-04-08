package com.example.demo.security;

import com.example.demo.interfaces.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsImpl implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserDetailsImpl.class);

    private final UserService userService;

    public UserDetailsImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("loadUserByEmail {}", email);
        try {
            return userService.findByEmail(email); // Devuelve Users directamente
        } catch (EntityNotFoundException e) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
    }
}