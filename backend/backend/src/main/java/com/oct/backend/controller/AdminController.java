package com.oct.backend.controller;

import com.oct.backend.entity.User;
import com.oct.backend.repository.ComplaintRepository;
import com.oct.backend.repository.ReportRepository;
import com.oct.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    private String userName(Long id) {
        if (id == null) return null;
        return userRepository.findById(id).map(User::getName).orElse("Unknown");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        var users = userRepository.findAll().stream()
            .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("name", u.getName());
                m.put("email", u.getEmail());
                m.put("role", u.getRole());
                m.put("status", u.getStatus() == null ? "ACTIVE" : u.getStatus());
                m.put("banned", Boolean.TRUE.equals(u.getBanned()));
                m.put("online", u.isOnline());
                m.put("hasDocuments", u.getIdDocument() != null || u.getSpecialtyCertificate() != null || u.getPracticeLicense() != null);
                m.put("createdAt", u.getCreatedAt());
                return m;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}/documents")
    public ResponseEntity<?> getUserDocuments(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("idDocument", u.getIdDocument());
            m.put("specialtyCertificate", u.getSpecialtyCertificate());
            m.put("practiceLicense", u.getPracticeLicense());
            return ResponseEntity.ok((Object) m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setStatus("ACTIVE");
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User approved"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setStatus("REJECTED");
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User rejected"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setBanned(true);
            u.setOnline(false);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User banned"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setBanned(false);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User unbanned"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long patients = userRepository.countByRole("PATIENT");
        long doctors = userRepository.countByRole("DOCTOR");
        long pendingDoctors = userRepository.countByRoleAndStatus("DOCTOR", "PENDING");
        stats.put("totalUsers", patients + doctors);
        stats.put("patients", patients);
        stats.put("doctors", doctors);
        stats.put("pendingDoctors", pendingDoctors);
        stats.put("reports", reportRepository.count());
        stats.put("openComplaints", complaintRepository.findAll().stream()
            .filter(c -> "OPEN".equalsIgnoreCase(c.getStatus())).count());
        return ResponseEntity.ok(stats);
    }

    // ─── Medical reports ─────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        var reports = reportRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("patientId", r.getPatientId());
                m.put("patientName", userName(r.getPatientId()));
                m.put("doctorId", r.getDoctorId());
                m.put("doctorName", userName(r.getDoctorId()));
                m.put("type", r.getType());
                m.put("diagnosis", r.getDiagnosis());
                m.put("confidence", r.getConfidence());
                m.put("status", r.getStatus());
                m.put("createdAt", r.getCreatedAt());
                return m;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        if (!reportRepository.existsById(id)) return ResponseEntity.notFound().build();
        reportRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Report deleted"));
    }

    // ─── Complaints (doctor → about a patient) ───────────

    @GetMapping("/complaints")
    public ResponseEntity<?> getComplaints() {
        var complaints = complaintRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.getId());
                m.put("reporterId", c.getReporterId());
                m.put("reporterName", userName(c.getReporterId()));
                m.put("targetUserId", c.getTargetUserId());
                m.put("targetName", userName(c.getTargetUserId()));
                userRepository.findById(c.getTargetUserId()).ifPresent(u -> {
                    m.put("targetEmail", u.getEmail());
                    m.put("targetStatus", u.getStatus() == null ? "ACTIVE" : u.getStatus());
                    m.put("targetBanned", Boolean.TRUE.equals(u.getBanned()));
                });
                m.put("reason", c.getReason());
                m.put("status", c.getStatus());
                m.put("createdAt", c.getCreatedAt());
                return m;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(complaints);
    }

    @PutMapping("/complaints/{id}/resolve")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long id) {
        return complaintRepository.findById(id).map(c -> {
            c.setStatus("RESOLVED");
            complaintRepository.save(c);
            return ResponseEntity.ok(Map.of("message", "Complaint resolved"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/complaints/{id}")
    public ResponseEntity<?> deleteComplaint(@PathVariable Long id) {
        if (!complaintRepository.existsById(id)) return ResponseEntity.notFound().build();
        complaintRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Complaint deleted"));
    }
}
