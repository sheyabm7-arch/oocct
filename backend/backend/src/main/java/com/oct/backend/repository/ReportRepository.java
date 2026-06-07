package com.oct.backend.repository;

import com.oct.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Report> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<Report> findAllByOrderByCreatedAtDesc();
}
