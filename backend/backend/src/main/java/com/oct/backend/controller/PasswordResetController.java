package com.oct.backend.controller;

import com.oct.backend.entity.PasswordResetOtp;
import com.oct.backend.entity.User;
import com.oct.backend.repository.PasswordResetOtpRepository;
import com.oct.backend.repository.UserRepository;
import com.oct.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordResetOtpRepository otpRepository;
    @Autowired private EmailService emailService;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    // ── Step 1: Send OTP ─────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));

        // Check user exists
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No account found with this email address"));

        // Rate limit: max 3 OTPs per hour
        long recentCount = otpRepository
            .findByEmailAndCreatedAtAfter(email, LocalDateTime.now().minusHours(1))
            .size();
        if (recentCount >= 3)
            return ResponseEntity.badRequest().body(Map.of("error", "Too many requests. Please wait before trying again."));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP
        PasswordResetOtp entity = new PasswordResetOtp();
        entity.setEmail(email);
        entity.setOtpCode(otp);
        otpRepository.save(entity);

        // Send email
        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) { // MessagingException | UnsupportedEncodingException
            System.err.println("EMAIL ERROR: " + e.getClass().getName() + ": " + e.getMessage());
            if (e.getCause() != null) System.err.println("CAUSE: " + e.getCause().getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("message", "Verification code sent to your email"));
    }

    // ── Step 2: Verify OTP ───────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email   = body.get("email");
        String otpCode = body.get("otpCode");

        Optional<PasswordResetOtp> otpOpt = otpRepository
            .findByEmailAndOtpCodeAndIsUsedFalse(email, otpCode);

        if (otpOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));

        if (otpOpt.get().getExpiresAt().isBefore(LocalDateTime.now()))
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code has expired"));

        return ResponseEntity.ok(Map.of("valid", true));
    }

    // ── Step 3: Reset Password ───────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.get("email");
        String otpCode     = body.get("otpCode");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));

        Optional<PasswordResetOtp> otpOpt = otpRepository
            .findByEmailAndOtpCodeAndIsUsedFalse(email, otpCode);

        if (otpOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code"));

        PasswordResetOtp otp = otpOpt.get();
        if (otp.getExpiresAt().isBefore(LocalDateTime.now()))
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code has expired"));

        // Update password
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark OTP as used
        otp.setUsed(true);
        otpRepository.save(otp);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
