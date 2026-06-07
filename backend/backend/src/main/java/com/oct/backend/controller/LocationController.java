package com.oct.backend.controller;

import com.oct.backend.entity.DoctorProfile;
import com.oct.backend.entity.User;
import com.oct.backend.repository.DoctorProfileRepository;
import com.oct.backend.repository.DoctorRatingRepository;
import com.oct.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class LocationController {

    @Autowired private UserRepository userRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;
    @Autowired private DoctorRatingRepository ratingRepository;

    // Middle East countries with cities and ISO codes
    private static final List<Map<String, Object>> COUNTRIES = List.of(
        country("Jordan", "JO", "Amman", "Irbid", "Zarqa", "Aqaba", "Petra"),
        country("Saudi Arabia", "SA", "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"),
        country("UAE", "AE", "Dubai", "Abu Dhabi", "Sharjah", "Ajman"),
        country("Kuwait", "KW", "Kuwait City", "Hawalli", "Salmiya"),
        country("Qatar", "QA", "Doha", "Al Wakrah", "Al Khor"),
        country("Bahrain", "BH", "Manama", "Riffa", "Muharraq"),
        country("Oman", "OM", "Muscat", "Salalah", "Nizwa"),
        country("Egypt", "EG", "Cairo", "Alexandria", "Giza", "Luxor"),
        country("Lebanon", "LB", "Beirut", "Tripoli", "Sidon"),
        country("Syria", "SY", "Damascus", "Aleppo", "Homs", "Latakia"),
        country("Iraq", "IQ", "Baghdad", "Basra", "Mosul", "Erbil"),
        country("Palestine", "PS", "Ramallah", "Gaza", "Nablus", "Hebron"),
        country("Yemen", "YE", "Sanaa", "Aden", "Taiz"),
        country("Libya", "LY", "Tripoli", "Benghazi", "Misrata"),
        country("Tunisia", "TN", "Tunis", "Sfax", "Sousse"),
        country("Morocco", "MA", "Casablanca", "Rabat", "Marrakesh", "Fez"),
        country("Algeria", "DZ", "Algiers", "Oran", "Constantine")
    );

    private static Map<String, Object> country(String name, String code, String... cities) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("code", code);
        m.put("cities", List.of(cities));
        return m;
    }

    @GetMapping("/location/countries")
    public ResponseEntity<?> countries() {
        List<Map<String, String>> result = COUNTRIES.stream()
            .map(c -> Map.of("name", (String) c.get("name"), "code", (String) c.get("code")))
            .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/location/cities/{countryCode}")
    public ResponseEntity<?> cities(@PathVariable String countryCode) {
        for (Map<String, Object> c : COUNTRIES) {
            if (c.get("code").equals(countryCode.toUpperCase())) {
                @SuppressWarnings("unchecked")
                List<String> cities = (List<String>) c.get("cities");
                List<Map<String, String>> result = cities.stream().map(name -> Map.of("name", name)).toList();
                return ResponseEntity.ok(result);
            }
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/doctors/by-location")
    public ResponseEntity<?> byLocation(@RequestParam(required = false) String country,
                                        @RequestParam(required = false) String city) {
        List<User> doctors = userRepository.findByRole("DOCTOR").stream()
            .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()) && !Boolean.TRUE.equals(d.getBanned()))
            .filter(d -> country == null || country.isBlank() || country.equalsIgnoreCase(d.getCountry()))
            .filter(d -> city == null || city.isBlank() || city.equalsIgnoreCase(d.getCity()))
            .toList();

        List<Map<String, Object>> result = doctors.stream().map(d -> {
            DoctorProfile p = doctorProfileRepository.findByDoctorId(d.getId()).orElse(new DoctorProfile());
            Double avg = ratingRepository.findAverageRatingByDoctorId(d.getId());
            long total = ratingRepository.countByDoctorId(d.getId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("name", d.getName());
            m.put("profilePicture", d.getProfilePicture());
            m.put("country", d.getCountry());
            m.put("city", d.getCity());
            m.put("online", d.isOnline());
            m.put("specialty", p.getSpecialty());
            m.put("clinicName", p.getClinicName());
            m.put("clinicAddress", p.getClinicAddress());
            m.put("clinicLatitude", p.getClinicLatitude());
            m.put("clinicLongitude", p.getClinicLongitude());
            m.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            m.put("totalRatings", total);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
