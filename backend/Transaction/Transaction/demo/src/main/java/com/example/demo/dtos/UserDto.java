package com.example.demo.dtos;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;

    public UserDto() {
    }

    public UserDto(Long id, String username, int credits) {
        this.id = id;
        this.username = username;
        this.credits = credits;
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

    private int credits;
}

