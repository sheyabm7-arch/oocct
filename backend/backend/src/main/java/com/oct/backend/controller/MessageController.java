package com.oct.backend.controller;

import com.oct.backend.entity.Message;
import com.oct.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Message message) {
        return ResponseEntity.ok(messageRepository.save(message));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getMessages(@PathVariable Long userId) {
        return ResponseEntity.ok(
            messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)
        );
    }

}
