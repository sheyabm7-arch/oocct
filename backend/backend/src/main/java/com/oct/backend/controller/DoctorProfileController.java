package com.oct.backend.controller;

import com.oct.backend.entity.*;
import com.oct.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/doctor")
public class DoctorProfileController {

    @Autowired private UserRepository userRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;
    @Autowired private DoctorCertificateRepository certificateRepository;
    @Autowired private DoctorSkillRepository skillRepository;
    @Autowired private DoctorRatingRepository ratingRepository;

    @GetMapping("/profile/{doctorId}")
    public ResponseEntity<?> getDoctorProfile(@PathVariable Long doctorId) {
        User doctor = userRepository.findById(doctorId).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
            .orElse(new DoctorProfile());
        List<DoctorCertificate> certificates = certificateRepository.findByDoctorId(doctorId);
        List<DoctorSkill> skills = skillRepository.findByDoctorId(doctorId);
        Double avgRating = ratingRepository.findAverageRatingByDoctorId(doctorId);
        long totalRatings = ratingRepository.countByDoctorId(doctorId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", doctor.getId());
        result.put("name", doctor.getName());
        result.put("email", doctor.getEmail());
        result.put("profilePicture", doctor.getProfilePicture());
        result.put("phone", doctor.getPhone());
        result.put("bio", doctor.getBio());
        result.put("gender", doctor.getGender());
        result.put("country", doctor.getCountry());
        result.put("city", doctor.getCity());
        result.put("online", doctor.isOnline());
        result.put("createdAt", doctor.getCreatedAt());
        result.put("yearsExperience", profile.getYearsExperience());
        result.put("hospital", profile.getHospital());
        result.put("clinicLocation", profile.getClinicLocation());
        result.put("consultationFee", profile.getConsultationFee());
        result.put("specialty", profile.getSpecialty());
        result.put("clinicName", profile.getClinicName());
        result.put("clinicAddress", profile.getClinicAddress());
        result.put("clinicLatitude", profile.getClinicLatitude());
        result.put("clinicLongitude", profile.getClinicLongitude());
        result.put("certificates", certificates);
        result.put("skills", skills);
        result.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        result.put("totalRatings", totalRatings);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/profile/update")
    public ResponseEntity<?> updateDoctorProfile(@RequestBody Map<String, Object> updates) {
        Long doctorId = Long.parseLong(updates.get("doctorId").toString());

        User doctor = userRepository.findById(doctorId).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();

        if (updates.containsKey("name") && updates.get("name") != null)
            doctor.setName((String) updates.get("name"));
        if (updates.containsKey("phone")) doctor.setPhone((String) updates.get("phone"));
        if (updates.containsKey("bio"))   doctor.setBio((String) updates.get("bio"));
        if (updates.containsKey("gender")) doctor.setGender((String) updates.get("gender"));
        if (updates.containsKey("country")) doctor.setCountry((String) updates.get("country"));
        if (updates.containsKey("city")) doctor.setCity((String) updates.get("city"));
        userRepository.save(doctor);

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
            .orElse(new DoctorProfile());
        profile.setDoctorId(doctorId);
        if (updates.containsKey("specialty"))      profile.setSpecialty((String) updates.get("specialty"));
        if (updates.containsKey("hospital"))       profile.setHospital((String) updates.get("hospital"));
        if (updates.containsKey("clinicLocation")) profile.setClinicLocation((String) updates.get("clinicLocation"));
        if (updates.containsKey("yearsExperience"))
            profile.setYearsExperience(parseInt(updates.get("yearsExperience")));
        if (updates.containsKey("consultationFee"))
            profile.setConsultationFee(parseDecimal(updates.get("consultationFee")));
        if (updates.containsKey("clinicName"))    profile.setClinicName((String) updates.get("clinicName"));
        if (updates.containsKey("clinicAddress")) profile.setClinicAddress((String) updates.get("clinicAddress"));
        if (updates.containsKey("clinicLatitude"))
            profile.setClinicLatitude(parseDouble(updates.get("clinicLatitude")));
        if (updates.containsKey("clinicLongitude"))
            profile.setClinicLongitude(parseDouble(updates.get("clinicLongitude")));

        doctorProfileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    @PostMapping("/certificates/add")
    public ResponseEntity<?> addCertificate(@RequestBody DoctorCertificate cert) {
        return ResponseEntity.ok(certificateRepository.save(cert));
    }

    @DeleteMapping("/certificates/{id}")
    public ResponseEntity<?> deleteCertificate(@PathVariable Long id) {
        if (!certificateRepository.existsById(id)) return ResponseEntity.notFound().build();
        certificateRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/skills/add")
    public ResponseEntity<?> addSkill(@RequestBody DoctorSkill skill) {
        return ResponseEntity.ok(skillRepository.save(skill));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<?> deleteSkill(@PathVariable Long id) {
        if (!skillRepository.existsById(id)) return ResponseEntity.notFound().build();
        skillRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Safe parsers — return null for blank/invalid instead of throwing ──
    private static Integer parseInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        try { return (int) Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }

    private static Double parseDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }

    private static BigDecimal parseDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        try { return new BigDecimal(s); } catch (NumberFormatException e) { return null; }
    }
}
