package com.example.demo.dtos;

public class UserInfoDto {
    private Long id;
    private String email;
    private String role;
    private String imageUrl;
    private String imageId;

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }

    // Constructor vacío (necesario para deserialización con WebClient)
    public UserInfoDto() {
    }

    // Constructor con parámetros
    public UserInfoDto(Long id, String email, String role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}