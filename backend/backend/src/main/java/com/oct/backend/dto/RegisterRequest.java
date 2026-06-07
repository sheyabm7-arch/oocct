package com.oct.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role; // PATIENT or DOCTOR

    // Location (both roles)
    private String country;
    private String city;

    // Required when role == DOCTOR (base64 image data)
    private String idDocument;
    private String specialtyCertificate;
    private String practiceLicense;

    // Doctor clinic info
    private String clinicName;
    private String clinicAddress;
}
