package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateUserProfileDto {
    private String aboutMe;
    private String profilePictureUrl;
    private String profilePictureId;

    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePictureId) {
        this.profilePictureId = profilePictureId;
    }

    // Constructor vacío (necesario para deserialización JSON)
    public UpdateUserProfileDto() {
    }

    public UpdateUserProfileDto(String aboutMe, String profilePicture, String profilePictureId) {
        this.aboutMe = aboutMe;
        this.profilePictureUrl = profilePicture;
        this.profilePictureId = profilePictureId;
    }

    // Getters y setters
    public String getAboutMe() {
        return aboutMe;
    }

    public void setAboutMe(String aboutMe) {
        this.aboutMe = aboutMe;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }
}