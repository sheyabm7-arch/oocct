package com.oct.backend.controller;

import com.oct.backend.dto.LoginRequest;
import com.oct.backend.dto.RegisterRequest;
import com.oct.backend.entity.DoctorProfile;
import com.oct.backend.entity.User;
import com.oct.backend.repository.DoctorProfileRepository;
import com.oct.backend.repository.UserRepository;
import com.oct.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        boolean isDoctor = "DOCTOR".equalsIgnoreCase(req.getRole());
        if (isDoctor) {
            if (isBlank(req.getIdDocument()) || isBlank(req.getSpecialtyCertificate()) || isBlank(req.getPracticeLicense())) {
                return ResponseEntity.badRequest().body(Map.of("error",
                    "Doctors must upload 3 documents: ID/passport, ophthalmology specialty certificate, and practice license."));
            }
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setStatus(isDoctor ? "PENDING" : "ACTIVE");
        user.setCountry(req.getCountry());
        user.setCity(req.getCity());
        if (isDoctor) {
            user.setIdDocument(req.getIdDocument());
            user.setSpecialtyCertificate(req.getSpecialtyCertificate());
            user.setPracticeLicense(req.getPracticeLicense());
        }
        userRepository.save(user);

        // Create initial doctor profile with clinic info
        if (isDoctor) {
            DoctorProfile profile = new DoctorProfile();
            profile.setDoctorId(user.getId());
            profile.setClinicName(req.getClinicName());
            profile.setClinicAddress(req.getClinicAddress());
            profile.setClinicLocation(req.getCity());
            doctorProfileRepository.save(profile);
        }
        return ResponseEntity.ok(Map.of("message",
            "DOCTOR".equalsIgnoreCase(req.getRole())
                ? "Registered successfully. Your account is pending admin approval."
                : "Registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
        if (Boolean.TRUE.equals(user.getBanned())) {
            return ResponseEntity.status(403).body(Map.of("error", "Your account has been banned by the administrator."));
        }
        String status = user.getStatus();
        if ("REJECTED".equalsIgnoreCase(status)) {
            return ResponseEntity.status(403).body(Map.of("error", "Your account has been rejected by the administrator."));
        }
        if ("DOCTOR".equalsIgnoreCase(user.getRole()) && !"ACTIVE".equalsIgnoreCase(status)) {
            return ResponseEntity.status(403).body(Map.of("error", "Your doctor account is pending admin approval."));
        }
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole()
        ));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
