package com.oct.backend.controller;

import com.oct.backend.entity.DoctorRating;
import com.oct.backend.repository.DoctorRatingRepository;
import com.oct.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/rating")
public class RatingController {

    @Autowired private DoctorRatingRepository ratingRepository;
    @Autowired private UserRepository userRepository;

    @PostMapping("/submit")
    public ResponseEntity<?> submitRating(@RequestBody DoctorRating rating) {
        if (ratingRepository.findByDoctorIdAndPatientId(rating.getDoctorId(), rating.getPatientId()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "You have already rated this doctor"));

        if (rating.getRating() == null || rating.getRating() < 1 || rating.getRating() > 5)
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));

        return ResponseEntity.ok(ratingRepository.save(rating));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getDoctorRatings(@PathVariable Long doctorId) {
        List<Map<String, Object>> result = ratingRepository
            .findByDoctorIdOrderByCreatedAtDesc(doctorId)
            .stream()
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("rating", r.getRating());
                m.put("review", r.getReview());
                m.put("createdAt", r.getCreatedAt());
                userRepository.findById(r.getPatientId()).ifPresent(u ->
                    m.put("patientName", u.getName().split(" ")[0]));
                return m;
            }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/doctor/{doctorId}/average")
    public ResponseEntity<?> getAverage(@PathVariable Long doctorId) {
        Double avg = ratingRepository.findAverageRatingByDoctorId(doctorId);
        return ResponseEntity.ok(Map.of(
            "average", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "total",   ratingRepository.countByDoctorId(doctorId)
        ));
    }

    @GetMapping("/check/{doctorId}/{patientId}")
    public ResponseEntity<?> checkRating(@PathVariable Long doctorId, @PathVariable Long patientId) {
        boolean alreadyRated = ratingRepository
            .findByDoctorIdAndPatientId(doctorId, patientId).isPresent();

        // Any patient may rate any doctor (only once)
        return ResponseEntity.ok(Map.of("alreadyRated", alreadyRated, "eligible", true));
    }
}
