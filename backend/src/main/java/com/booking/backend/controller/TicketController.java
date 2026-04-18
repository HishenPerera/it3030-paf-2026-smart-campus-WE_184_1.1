package com.booking.backend.controller;

import com.booking.backend.model.Ticket;
import com.booking.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<?> createTicket(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam("resourceOrLocation") String resourceOrLocation,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam("contactDetails") String contactDetails,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        
        try {
            if (files != null && files.size() > 3) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "A maximum of 3 files allowed as evidence."));
            }

            String email = null;
            if (principal != null) {
                email = principal.getAttribute("email");
            }

            Ticket ticket = ticketService.createTicket(
                    email, resourceOrLocation, category, description, priority, contactDetails, files);

            return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("message", "Error submitting ticket: " + e.getMessage()));
        }
    }
}
