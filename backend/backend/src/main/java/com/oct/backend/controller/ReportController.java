package com.oct.backend.controller;

import com.oct.backend.entity.Report;
import com.oct.backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Report report) {
        return ResponseEntity.ok(reportRepository.save(report));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(reportRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getDoctorReports(@PathVariable Long doctorId) {
        return ResponseEntity.ok(reportRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        if (!reportRepository.existsById(id)) return ResponseEntity.notFound().build();
        reportRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Report report = reportRepository.findById(id).orElse(null);
        if (report == null) return ResponseEntity.notFound().build();
        report.setStatus(body.get("status"));
        return ResponseEntity.ok(reportRepository.save(report));
    }
}
