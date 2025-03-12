package com.example.demo.interfaces;

import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.dtos.ResetPasswordResponseDto;
import com.example.demo.dtos.ConfirmResetRequestDto;

public interface PasswordResetService {
    ResetPasswordResponseDto requestPasswordReset(ResetPasswordRequestDto requestDto);
    void confirmPasswordReset(ConfirmResetRequestDto requestDto);
}