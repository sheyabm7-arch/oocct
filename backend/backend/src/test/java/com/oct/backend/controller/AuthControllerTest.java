package com.oct.backend.controller;

import com.oct.backend.dto.LoginRequest;
import com.oct.backend.dto.RegisterRequest;
import com.oct.backend.entity.User;
import com.oct.backend.repository.DoctorProfileRepository;
import com.oct.backend.repository.UserRepository;
import com.oct.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthController using Mockito.
 * The controller's dependencies are mocked, so no database or Spring context is needed.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private DoctorProfileRepository doctorProfileRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks private AuthController authController;

    @SuppressWarnings("unchecked")
    private Map<String, Object> body(ResponseEntity<?> res) {
        return (Map<String, Object>) res.getBody();
    }

    // 1) Successful patient registration
    @Test
    void registerPatient_succeeds() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Mahmood");
        req.setEmail("patient@test.com");
        req.setPassword("123456");
        req.setRole("PATIENT");

        when(userRepository.findByEmail("patient@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("123456")).thenReturn("hashed");

        ResponseEntity<?> res = authController.register(req);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals("Registered successfully", body(res).get("message"));
        verify(userRepository).save(any(User.class));
    }

    // 2) Registration with a duplicate email returns an error
    @Test
    void registerDuplicateEmail_returnsError() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("taken@test.com");
        req.setRole("PATIENT");

        when(userRepository.findByEmail("taken@test.com"))
            .thenReturn(Optional.of(new User()));

        ResponseEntity<?> res = authController.register(req);

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("Email already exists", body(res).get("error"));
        verify(userRepository, never()).save(any());
    }

    // 3) Successful login returns a JWT token
    @Test
    void login_succeeds_returnsToken() {
        User user = new User();
        user.setId(1L);
        user.setName("Mahmood");
        user.setEmail("patient@test.com");
        user.setPassword("hashed");
        user.setRole("PATIENT");
        user.setStatus("ACTIVE");
        user.setBanned(false);

        LoginRequest req = new LoginRequest();
        req.setEmail("patient@test.com");
        req.setPassword("123456");

        when(userRepository.findByEmail("patient@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "patient@test.com", "PATIENT")).thenReturn("jwt-token-123");

        ResponseEntity<?> res = authController.login(req);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals("jwt-token-123", body(res).get("token"));
        assertEquals("PATIENT", body(res).get("role"));
    }

    // 4) Login with the wrong password returns 401
    @Test
    void login_wrongPassword_returns401() {
        User user = new User();
        user.setEmail("patient@test.com");
        user.setPassword("hashed");

        LoginRequest req = new LoginRequest();
        req.setEmail("patient@test.com");
        req.setPassword("wrong");

        when(userRepository.findByEmail("patient@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        ResponseEntity<?> res = authController.login(req);

        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertEquals("Invalid email or password", body(res).get("error"));
    }
}
