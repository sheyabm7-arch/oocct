package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Long doctorId;
    private String type;        // CLASSIFICATION, FLUID, ENHANCE
    private String diagnosis;
    private Double confidence;
    private String recommendation;
    private String status;      // PENDING, REVIEWED

    @Column(columnDefinition = "TEXT")
    private String imageData; // base64 encoded OCT image

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}
