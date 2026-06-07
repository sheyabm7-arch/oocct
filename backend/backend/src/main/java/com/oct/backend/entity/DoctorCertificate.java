package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "doctor_certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long doctorId;
    private String certificateName;
    private String institution;
    private Integer yearObtained;

    @Column(columnDefinition = "TEXT")
    private String certificateImage;
}
