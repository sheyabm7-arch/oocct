package com.oct.backend.controller;

import com.oct.backend.entity.PatientImage;
import com.oct.backend.repository.PatientImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient-images")
public class PatientImageController {

    @Autowired
    private PatientImageRepository repository;

    // Save an uploaded OCT image to the patient's private gallery
    @PostMapping
    public ResponseEntity<?> save(@RequestBody PatientImage image) {
        return ResponseEntity.ok(repository.save(image));
    }

    // Get all images for a patient (private — only the owner fetches their own)
    @GetMapping("/{patientId}")
    public ResponseEntity<?> getForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientIdOrderByUploadedAtDesc(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
