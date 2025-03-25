package com.example.demo.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private int credits;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "about_me")
    private String aboutMe;

    @Column(name = "profile_picture")
    private String profilePicture;

    // Constructor vacío (necesario para JPA)
    public User() {
    }

    // Constructor con campos (opcional, para facilitar la creación de instancias)
    public User(String username, int credits, LocalDateTime updatedAt, String aboutMe, String profilePicture) {
        this.username = username;
        this.credits = credits;
        this.updatedAt = updatedAt;
        this.aboutMe = aboutMe;
        this.profilePicture = profilePicture;
    }

    // Getters y setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getAboutMe() {
        return aboutMe;
    }

    public void setAboutMe(String aboutMe) {
        this.aboutMe = aboutMe;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}