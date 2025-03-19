package com.example.demo.interfaces;

import com.example.demo.dtos.CreateUserDto;
import com.example.demo.dtos.UpdateUserDto;
import com.example.demo.dtos.UserDto;
import com.example.demo.dtos.UserInfoDto;

public interface UserService {
    UserDto getUser(Long id);
    void updateUser(Long id, UpdateUserDto dto);
    void updateCredits(Long id, int amount);
    UserDto createUser(UserInfoDto userInfoDto);
}