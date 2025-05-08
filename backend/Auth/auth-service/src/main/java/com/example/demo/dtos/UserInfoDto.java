package com.example.demo.dtos;

public class UserInfoDto {
    private Long id;
    private String useremail;
    private String role;

    // Constructor vacío (necesario para deserialización con WebClient)
    public UserInfoDto() {
    }

    // Constructor con parámetros
    public UserInfoDto(Long id, String useremail, String role) {
        this.id = id;
        this.useremail = useremail;
        this.role = role;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUseremail() {
        return useremail;
    }

    public void setUseremail(String useremail) {
        this.useremail = useremail;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}