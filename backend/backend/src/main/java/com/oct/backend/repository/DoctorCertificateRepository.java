package com.oct.backend.repository;

import com.oct.backend.entity.DoctorCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorCertificateRepository extends JpaRepository<DoctorCertificate, Long> {
    List<DoctorCertificate> findByDoctorId(Long doctorId);
}
