package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreateUserDto {
    private Long id; // Agregamos el ID para mapearlo desde el UserInfoDto
    private String username;
    private String email; // Agregamos el email para mapearlo desde el UserInfoDto
    private String imageId;
    private String imageUrl;

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public CreateUserDto() {
    }

    public CreateUserDto(Long id, String username, String email, String imageId, String imageUrl) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.imageId = imageId;
        this.imageUrl = imageUrl;
    }

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}