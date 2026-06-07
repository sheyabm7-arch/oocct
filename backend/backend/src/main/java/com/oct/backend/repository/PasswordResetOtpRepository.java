package com.oct.backend.repository;

import com.oct.backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findByEmailAndOtpCodeAndIsUsedFalse(String email, String otpCode);
    List<PasswordResetOtp> findByEmailAndCreatedAtAfter(String email, LocalDateTime since);
}
