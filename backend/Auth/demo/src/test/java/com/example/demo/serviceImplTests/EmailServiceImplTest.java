package com.example.demo.serviceImplTests;

import com.example.demo.interfaces.EmailService;
import com.example.demo.services.EmailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    private String toEmail;
    private String token;

    @BeforeEach
    void setUp() {
        toEmail = "test@example.com";
        token = "123456";
    }

    @Test
    void sendResetPasswordEmail_ShouldSendEmail_WithCorrectContent() {
        emailService.sendResetPasswordEmail(toEmail, token);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sentMessage = captor.getValue();
        assertEquals(toEmail, sentMessage.getTo()[0]);
        assertEquals("Restablecer tu contraseña", sentMessage.getSubject());
        assertTrue(sentMessage.getText().contains("https://tuapp.com/reset-password?token=" + token));
    }
}
