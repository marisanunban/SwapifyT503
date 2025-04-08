package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateUserProfileDto {
    private String aboutMe;
    private String profilePicture;

    // Constructor vacío (necesario para deserialización JSON)
    public UpdateUserProfileDto() {
    }

    public UpdateUserProfileDto(String aboutMe, String profilePicture) {
        this.aboutMe = aboutMe;
        this.profilePicture = profilePicture;
    }

    // Getters y setters
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