package com.oct.backend.controller;

import com.oct.backend.entity.Complaint;
import com.oct.backend.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @PostMapping
    public ResponseEntity<?> fileComplaint(@RequestBody Complaint complaint) {
        if (complaint.getReporterId() == null || complaint.getTargetUserId() == null
                || complaint.getReason() == null || complaint.getReason().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "reporterId, targetUserId and reason are required"));
        }
        complaint.setId(null);
        complaint.setStatus("OPEN");
        Complaint saved = complaintRepository.save(complaint);
        return ResponseEntity.ok(Map.of("message", "Complaint submitted to administrator", "id", saved.getId()));
    }
}
