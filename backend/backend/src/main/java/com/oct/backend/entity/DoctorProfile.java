package com.oct.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "doctor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long doctorId;

    private Integer yearsExperience;
    private String hospital;
    private String clinicLocation;
    private BigDecimal consultationFee;
    private String specialty;

    // Clinic location for Google Maps
    private String clinicName;
    private String clinicAddress;
    private Double clinicLatitude;
    private Double clinicLongitude;
}
