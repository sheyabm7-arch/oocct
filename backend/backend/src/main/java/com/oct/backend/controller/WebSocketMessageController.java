package com.oct.backend.controller;

import com.oct.backend.entity.Message;
import com.oct.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketMessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate broker;

    /**
     * Clients publish to /app/chat.send
     * This handler saves the message to the DB, then pushes it to both
     * the receiver's and sender's personal topic channels so both UIs
     * update instantly without a page refresh.
     */
    @MessageMapping("/chat.send")
    public void handleMessage(@Payload Message message) {
        Message saved = messageRepository.save(message);

        // Push to receiver — they see the incoming message in real time
        broker.convertAndSend("/topic/messages." + saved.getReceiverId(), saved);

        // Push back to sender — their UI adds the sent message without HTTP round-trip
        broker.convertAndSend("/topic/messages." + saved.getSenderId(), saved);
    }
}
