package com.oct.backend.controller;

import com.oct.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/doctors")
    public ResponseEntity<?> getDoctors() {
        var doctors = userRepository.findByRole("DOCTOR").stream()
            .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
            .map(u -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("name", u.getName());
                m.put("email", u.getEmail());
                m.put("online", u.isOnline());
                m.put("country", u.getCountry());
                m.put("city", u.getCity());
                return m;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getPatients() {
        var patients = userRepository.findByRole("PATIENT").stream()
            .map(u -> Map.of("id", u.getId(), "name", u.getName()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(patients);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> setOnlineStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return userRepository.findById(id).map(u -> {
            u.setOnline(body.getOrDefault("online", false));
            userRepository.save(u);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
