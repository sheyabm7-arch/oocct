package com.oct.backend.repository;

import com.oct.backend.entity.DoctorSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorSkillRepository extends JpaRepository<DoctorSkill, Long> {
    List<DoctorSkill> findByDoctorId(Long doctorId);
}
