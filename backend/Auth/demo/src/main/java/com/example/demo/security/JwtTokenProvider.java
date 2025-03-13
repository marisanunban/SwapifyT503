package com.example.demo.security;

import com.example.demo.entities.Users;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.security.jwt.secret}")
    private String jwtSecret;

    @Value("${app.security.jwt.expiration}")
    private Long jwtDurationSeconds;

    public String generateToken(Authentication authentication) {
        Users user = (Users) authentication.getPrincipal();

        byte[] keyBytes = jwtSecret.getBytes();
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret key must be at least 32 bytes long");
        }

        return Jwts.builder()
                .header().type("JWT").and() // Método moderno para setHeaderParam
                .subject(user.getUsername()) // getUsername() devuelve el email
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtDurationSeconds * 1000))
                .claim("email", user.getUsername())
                .signWith(Keys.hmacShaKeyFor(keyBytes), Jwts.SIG.HS512) // API moderna para signWith
                .compact();
    }

    public boolean isValidToken(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes())) // Reemplaza setSigningKey
                    .build()
                    .parseSignedClaims(token); // Reemplaza parseClaimsJws
            return true;
        } catch (SignatureException e) {
            log.info("Error signing token", e);
        } catch (MalformedJwtException | UnsupportedJwtException e) {
            log.info("Incorrect Token", e);
        } catch (ExpiredJwtException e) {
            log.info("Expired Token", e);
        } catch (Exception e) {
            log.error("Unexpected error while parsing token", e);
        }
        return false;
    }

    public String getUsernameFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (Exception e) {
            log.error("Error extracting username from token", e);
            return null;
        }
    }
}