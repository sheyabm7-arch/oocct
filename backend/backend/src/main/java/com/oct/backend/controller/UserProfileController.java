package com.oct.backend.controller;

import com.oct.backend.entity.User;
import com.oct.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired private UserRepository userRepository;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        return userRepository.findById(userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates) {
        Long userId = Long.parseLong(updates.get("id").toString());
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (updates.containsKey("name") && updates.get("name") != null)
            user.setName((String) updates.get("name"));
        if (updates.containsKey("phone"))
            user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("bio"))
            user.setBio((String) updates.get("bio"));
        if (updates.containsKey("gender"))
            user.setGender((String) updates.get("gender"));
        if (updates.containsKey("country"))
            user.setCountry((String) updates.get("country"));
        if (updates.containsKey("city"))
            user.setCity((String) updates.get("city"));
        if (updates.containsKey("dateOfBirth") && updates.get("dateOfBirth") != null) {
            String dob = (String) updates.get("dateOfBirth");
            if (!dob.isBlank()) user.setDateOfBirth(LocalDate.parse(dob));
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/picture")
    public ResponseEntity<?> uploadPicture(@RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(body.get("userId"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        user.setProfilePicture(body.get("imageData"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(body.get("userId"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (!passwordEncoder.matches(body.get("currentPassword"), user.getPassword()))
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));

        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
