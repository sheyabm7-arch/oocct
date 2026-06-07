package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private String role; // PATIENT, DOCTOR or ADMIN

    private String status; // approval state: ACTIVE, PENDING or REJECTED

    private Boolean banned = false; // ban is independent of approval state

    // Doctor verification documents (base64 image data)
    @Column(columnDefinition = "TEXT")
    private String idDocument;          // national ID or passport

    @Column(columnDefinition = "TEXT")
    private String specialtyCertificate; // ophthalmology specialty certificate

    @Column(columnDefinition = "TEXT")
    private String practiceLicense;      // current medical practice license

    private boolean online = false;

    @Column(columnDefinition = "TEXT")
    private String profilePicture;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private LocalDate dateOfBirth;

    private String gender;

    private String country; // e.g. "Jordan"
    private String city;    // e.g. "Amman"

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
