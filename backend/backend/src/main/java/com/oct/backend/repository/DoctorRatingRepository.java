package com.oct.backend.repository;

import com.oct.backend.entity.DoctorRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface DoctorRatingRepository extends JpaRepository<DoctorRating, Long> {
    List<DoctorRating> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    Optional<DoctorRating> findByDoctorIdAndPatientId(Long doctorId, Long patientId);

    @Query("SELECT AVG(r.rating) FROM DoctorRating r WHERE r.doctorId = ?1")
    Double findAverageRatingByDoctorId(Long doctorId);

    long countByDoctorId(Long doctorId);
}
