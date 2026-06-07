package com.oct.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        List<Map<String, Object>> contents = new ArrayList<>();

        // Inject system context as the opening exchange so Gemini follows the rules
        contents.add(Map.of("role", "user",
            "parts", List.of(Map.of("text", systemPrompt))));
        contents.add(Map.of("role", "model",
            "parts", List.of(Map.of("text", "Hi! I'm your OCT assistant. How can I help you today?"))));

        // Replay conversation history so Gemini maintains context
        if (history != null) {
            for (Map<String, String> msg : history) {
                String role = "user".equals(msg.get("role")) ? "user" : "model";
                contents.add(Map.of("role", role,
                    "parts", List.of(Map.of("text", msg.get("content")))));
            }
        }

        // Current user turn
        contents.add(Map.of("role", "user",
            "parts", List.of(Map.of("text", userMessage))));

        Map<String, Object> body = Map.of("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
            GEMINI_URL + apiKey, entity, (Class<Map<String, Object>>) (Class<?>) Map.class);

        // Parse: candidates[0].content.parts[0].text
        List<?> candidates = (List<?>) response.getBody().get("candidates");
        Map<?, ?> candidate  = (Map<?, ?>) candidates.get(0);
        Map<?, ?> content    = (Map<?, ?>) candidate.get("content");
        List<?> parts        = (List<?>) content.get("parts");
        Map<?, ?> part       = (Map<?, ?>) parts.get(0);
        return (String) part.get("text");
    }
}
