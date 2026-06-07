package com.oct.backend.controller;

import com.oct.backend.entity.PasswordResetOtp;
import com.oct.backend.entity.User;
import com.oct.backend.repository.PasswordResetOtpRepository;
import com.oct.backend.repository.UserRepository;
import com.oct.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PasswordResetController using Mockito.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetOtpRepository otpRepository;
    @Mock private EmailService emailService;
    @Mock private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks private PasswordResetController controller;

    @SuppressWarnings("unchecked")
    private Map<String, Object> body(ResponseEntity<?> res) {
        return (Map<String, Object>) res.getBody();
    }

    // 1) Forgot password with a valid email sends an OTP
    @Test
    void forgotPassword_validEmail_sendsOtp() throws Exception {
        String email = "patient@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new User()));
        when(otpRepository.findByEmailAndCreatedAtAfter(eq(email), any()))
            .thenReturn(List.of()); // no recent OTPs → not rate-limited

        ResponseEntity<?> res = controller.forgotPassword(Map.of("email", email));

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals("Verification code sent to your email", body(res).get("message"));
        verify(otpRepository).save(any(PasswordResetOtp.class));
        verify(emailService).sendOtpEmail(eq(email), anyString());
    }

    // 2) Forgot password with an unknown email returns an error
    @Test
    void forgotPassword_invalidEmail_returnsError() throws Exception {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        ResponseEntity<?> res = controller.forgotPassword(Map.of("email", "ghost@test.com"));

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("No account found with this email address", body(res).get("error"));
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }

    // 3) Verify OTP with the correct, still-valid code returns success
    @Test
    void verifyOtp_correctCode_returnsValid() {
        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail("patient@test.com");
        otp.setOtpCode("123456");
        otp.setExpiresAt(LocalDateTime.now().plusSeconds(60)); // still valid

        when(otpRepository.findByEmailAndOtpCodeAndIsUsedFalse("patient@test.com", "123456"))
            .thenReturn(Optional.of(otp));

        ResponseEntity<?> res = controller.verifyOtp(
            Map.of("email", "patient@test.com", "otpCode", "123456"));

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(true, body(res).get("valid"));
    }

    // 4) Verify OTP with an expired code returns an error
    @Test
    void verifyOtp_expiredCode_returnsError() {
        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail("patient@test.com");
        otp.setOtpCode("123456");
        otp.setExpiresAt(LocalDateTime.now().minusSeconds(10)); // already expired

        when(otpRepository.findByEmailAndOtpCodeAndIsUsedFalse("patient@test.com", "123456"))
            .thenReturn(Optional.of(otp));

        ResponseEntity<?> res = controller.verifyOtp(
            Map.of("email", "patient@test.com", "otpCode", "123456"));

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("Verification code has expired", body(res).get("error"));
    }
}
