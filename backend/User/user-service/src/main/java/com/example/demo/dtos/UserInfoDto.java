package com.example.demo.dtos;

import lombok.Data;

@Data
public class UserInfoDto {
    private Long id;
    private String username;
    private String useremail;
    private String nickname;
    private String role;

    // Constructor vacío
    public UserInfoDto() {
    }

    // Constructor principal
    public UserInfoDto(Long id, String username, String useremail, String nickname, String role) {
        this.id = id;
        this.username = username;
        this.useremail = useremail;
        this.nickname = nickname;
        this.role = role;
    }
}