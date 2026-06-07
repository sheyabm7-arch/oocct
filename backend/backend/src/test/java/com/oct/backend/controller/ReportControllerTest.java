package com.oct.backend.controller;

import com.oct.backend.entity.Report;
import com.oct.backend.repository.ReportRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReportController using Mockito.
 */
@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock private ReportRepository reportRepository;
    @InjectMocks private ReportController reportController;

    // 1) A patient can create a report
    @Test
    void createReport_succeeds() {
        Report report = new Report();
        report.setPatientId(1L);
        report.setDoctorId(2L);
        report.setType("AI Diagnosis");
        report.setDiagnosis("CNV");

        when(reportRepository.save(report)).thenReturn(report);

        ResponseEntity<?> res = reportController.createReport(report);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertSame(report, res.getBody());
        verify(reportRepository).save(report);
    }

    // 2) A patient can fetch their own reports
    @Test
    void getPatientReports_returnsList() {
        Report r1 = new Report();
        Report r2 = new Report();
        when(reportRepository.findByPatientIdOrderByCreatedAtDesc(1L))
            .thenReturn(List.of(r1, r2));

        ResponseEntity<?> res = reportController.getPatientReports(1L);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(2, ((List<?>) res.getBody()).size());
    }

    // 3) A doctor can fetch the reports sent to them
    @Test
    void getDoctorReports_returnsList() {
        Report r1 = new Report();
        when(reportRepository.findByDoctorIdOrderByCreatedAtDesc(2L))
            .thenReturn(List.of(r1));

        ResponseEntity<?> res = reportController.getDoctorReports(2L);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, ((List<?>) res.getBody()).size());
    }
}
