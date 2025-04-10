package com.example.demo.dtos;

public class UserProfileDto {
    private Long id; // Añadir el campo id
    private String username;
    private String aboutMe;
    private String profilePicture;
    private String pictureId;

    public String getPictureId() {
        return pictureId;
    }

    public void setPictureId(String pictureId) {
        this.pictureId = pictureId;
    }

    public UserProfileDto(String username, String aboutMe, String profilePicture, String pictureId) {
        this.username = username;
        this.aboutMe = aboutMe;
        this.profilePicture = profilePicture;
        this.pictureId = pictureId;
    }

    public UserProfileDto(Long id, String username, String aboutMe, String profilePicture, String pictureId) {
        this.id = id;
        this.username = username;
        this.aboutMe = aboutMe;
        this.profilePicture = profilePicture;
        this.pictureId = pictureId;
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