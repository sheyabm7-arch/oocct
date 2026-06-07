package com.oct.backend.repository;

import com.oct.backend.entity.PatientImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientImageRepository extends JpaRepository<PatientImage, Long> {
    List<PatientImage> findByPatientIdOrderByUploadedAtDesc(Long patientId);
}
