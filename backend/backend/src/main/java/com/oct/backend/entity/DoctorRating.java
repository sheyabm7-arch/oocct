package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_ratings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"doctor_id", "patient_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "patient_id")
    private Long patientId;

    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String review;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
