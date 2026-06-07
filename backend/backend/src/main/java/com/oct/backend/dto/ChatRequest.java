package com.oct.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    private Long patientId;
    private String message;
    private List<Map<String, String>> conversationHistory;
}
