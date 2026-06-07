package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;

    private String source; // e.g. "AI Diagnosis", "Image Enhancement", "Fluid Quantification"

    @Column(columnDefinition = "TEXT")
    private String imageData; // base64 encoded OCT image — private to the patient

    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {
        uploadedAt = LocalDateTime.now();
    }
}
