package com.example.demo.dtos;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private int credits;
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

    public UserDto() {
    }

    public UserDto(Long id, String username, int credits, String imageUrl, String imageId) {
        this.id = id;
        this.username = username;
        this.credits = credits;
        this.imageUrl = imageUrl;
        this.imageId = imageId;
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

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }


}