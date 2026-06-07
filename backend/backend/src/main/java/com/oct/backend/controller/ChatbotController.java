package com.oct.backend.controller;

import com.oct.backend.dto.ChatRequest;
import com.oct.backend.entity.Report;
import com.oct.backend.entity.User;
import com.oct.backend.repository.ReportRepository;
import com.oct.backend.repository.UserRepository;
import com.oct.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired private UserRepository userRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private GeminiService geminiService;

    @PostMapping("/message")
    public ResponseEntity<Map<String, String>> sendMessage(@RequestBody ChatRequest request) {
        // Patient name
        User patient = userRepository.findById(request.getPatientId()).orElse(null);
        String patientName = patient != null ? patient.getName() : "المريض";

        // Latest AI Diagnosis report (list is already sorted desc by createdAt)
        List<Report> reports = reportRepository.findByPatientIdOrderByCreatedAtDesc(request.getPatientId());
        String diagnosis  = "غير محدد";
        String confidence = "0";

        Optional<Report> latestDx = reports.stream()
            .filter(r -> r.getType() != null && r.getType().contains("AI Diagnosis"))
            .findFirst();

        if (latestDx.isPresent()) {
            Report dx = latestDx.get();
            if (dx.getDiagnosis() != null)  diagnosis  = dx.getDiagnosis();
            if (dx.getConfidence() != null) confidence = String.format("%.1f", dx.getConfidence());
        }

        // ── Live platform data from the database ──────────────────
        List<User> allDoctors = userRepository.findByRole("DOCTOR");
        // Only count/list approved (ACTIVE) doctors as "available"
        List<User> activeDoctors = allDoctors.stream()
            .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()) && !Boolean.TRUE.equals(d.getBanned()))
            .collect(Collectors.toList());
        List<User> onlineDoctors = activeDoctors.stream()
            .filter(User::isOnline)
            .collect(Collectors.toList());

        long totalPatients = userRepository.countByRole("PATIENT");
        long pendingDoctors = userRepository.countByRoleAndStatus("DOCTOR", "PENDING");

        String doctorList = activeDoctors.isEmpty()
            ? "(none)"
            : activeDoctors.stream()
                .map(d -> "Dr. " + d.getName() + " — " + (d.isOnline() ? "ONLINE" : "offline"))
                .collect(Collectors.joining("; "));

        String onlineList = onlineDoctors.isEmpty()
            ? "(none online right now)"
            : onlineDoctors.stream().map(d -> "Dr. " + d.getName()).collect(Collectors.joining(", "));

        String liveData = String.format(
            "LIVE PLATFORM DATA (current, from the database — use this to answer questions about doctors/users):\n" +
            "- Total approved doctors: %d\n" +
            "- Doctors currently ONLINE: %d (%s)\n" +
            "- All approved doctors: %s\n" +
            "- Doctors pending admin approval: %d\n" +
            "- Total registered patients: %d\n" +
            "- This patient's total reports: %d\n\n",
            activeDoctors.size(), onlineDoctors.size(), onlineList,
            doctorList, pendingDoctors, totalPatients, reports.size()
        );

        String systemPrompt = liveData + String.format(
            "You are a helpful assistant integrated into the OCT Analysis Platform — " +
            "an AI-powered web application for detecting retinal diseases from OCT (Optical Coherence Tomography) images. " +
            "Reply in the SAME language the user writes in (English or Arabic). Keep responses concise and friendly. " +
            "When asked about how many doctors exist, who is online, number of patients, etc., answer using the LIVE PLATFORM DATA above.\n\n" +

            "USER ROLES ON THE PLATFORM:\n" +
            "- PATIENT: registers instantly, uploads OCT scans, gets AI analysis, sends reports to doctors, messages doctors, rates doctors.\n" +
            "- DOCTOR: must be approved by an admin before logging in; reviews patient reports, replies in messages, manages a professional profile (certificates, skills), receives ratings.\n" +
            "- ADMIN: approves/rejects doctor registrations, bans users, manages reports and complaints.\n\n" +

            "PATIENT CONTEXT:\n" +
            "- Name: %s\n" +
            "- Latest AI diagnosis: %s (confidence: %s%%)\n\n" +

            "PLATFORM KNOWLEDGE — full feature guide. Use this to answer ANY 'how do I...' question:\n" +
            "1. AI Diagnosis: Sidebar → 'AI Diagnosis' → upload an OCT image → AI classifies it as CNV, DME, DRUSEN, or NORMAL with a confidence score → report saved automatically. The uploaded image is also auto-saved privately to your profile.\n" +
            "2. Image Enhancement: Sidebar → 'Image Enhancement' → upload an OCT image → AI denoises and sharpens it.\n" +
            "3. Fluid Quantification: Sidebar → 'Fluid Quantification' → upload an OCT scan → AI measures retinal fluid percentage and severity.\n" +
            "4. My Reports: Sidebar → 'My Reports' → view all reports with image, diagnosis, confidence, recommendation, and review status (Pending/Reviewed). You can cancel/delete a report there.\n" +
            "5. Send a report to a doctor: After an analysis, click 'Send to Doctor' and pick a doctor. Or from 'My Reports' click the Message button on a report.\n" +
            "6. Messages: Sidebar → 'Messages' → pick a doctor to chat in real time. Click a doctor's avatar or 'View Profile' to open their full profile.\n" +
            "7. Doctors: Sidebar → 'Doctors' → browse all doctors, search by name/specialty/hospital, open a profile to see bio, certificates, skills, ratings.\n" +
            "8. Rate a doctor: Open a doctor's profile (from Doctors or Messages). After you have sent them a report you can give 1-5 stars and an optional written review. You can rate each doctor once.\n" +
            "9. My Profile: Sidebar → 'My Profile' → edit name, phone, date of birth, gender, bio; upload a profile picture. It also shows your stats and your private OCT image gallery (only you can see those images).\n" +
            "10. Change password (while logged in): Go to 'My Profile' → click 'Change Password' → enter current + new password.\n" +
            "11. Forgot password (login screen): On the Login page click 'Forgot Password?' → enter your email → you receive a 6-digit code by email → enter the code → set a new password.\n" +
            "12. CHANGE LANGUAGE: Click the language button in the top header (it shows 'عربي' when in English, or 'EN' when in Arabic). Clicking it switches the whole app between English and Arabic, and the layout flips to right-to-left for Arabic. The choice is remembered.\n" +
            "13. DARK MODE: Click the moon/sun icon in the top header to toggle dark and light theme. The choice is remembered.\n" +
            "14. Logout: Click 'Logout' in the top header.\n" +
            "15. Registration: On the Login page choose the 'Register' tab. Patients are activated instantly. Doctors must upload 3 verification documents (ID, specialty certificate, practice license) and wait for admin approval before they can log in.\n\n" +

            "DOCTOR-SIDE FEATURES (explain if asked): doctors review pending reports, reply to patients in Messages, open a patient's profile from the chat to view info, can block a patient, and can report a patient to the admin. Doctors edit their own profile with specialty, hospital, clinic, years of experience, consultation fee, certificates, and skills.\n\n" +

            "TECH STACK (if asked): React + Tailwind frontend, Java Spring Boot backend with JWT auth, PostgreSQL database, a Python FastAPI AI service running the OCT models, and real-time messaging over WebSockets (STOMP).\n\n" +

            "RULES:\n" +
            "- Never provide a definitive medical diagnosis — always recommend consulting the doctor.\n" +
            "- If asked about symptoms or treatment, give general educational info and advise seeing a specialist.\n" +
            "- For any feature question, give the exact steps from the guide above.\n" +
            "- Be empathetic, supportive, and concise.",
            patientName, diagnosis, confidence
        );

        try {
            String reply = geminiService.chat(systemPrompt, request.getConversationHistory(), request.getMessage());
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("reply",
                "Sorry, I'm having trouble connecting right now. Please try again in a moment."));
        }
    }
}
