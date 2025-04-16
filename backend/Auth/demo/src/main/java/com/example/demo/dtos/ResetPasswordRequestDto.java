package com.example.demo.dtos;

import lombok.Data;

@Data
public class ResetPasswordRequestDto {
 private  String email;

 public ResetPasswordRequestDto(String email) {
  this.email = email;
 }

 public ResetPasswordRequestDto() {}
}
