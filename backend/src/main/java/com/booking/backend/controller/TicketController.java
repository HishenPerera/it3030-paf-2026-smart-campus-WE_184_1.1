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

    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) Long assignedTechnicianId,
            @RequestParam(required = false) String date) {
            
        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }
        
        List<Ticket> tickets = ticketService.getTicketsFiltered(
                email, status, priority, category, resource, assignedTechnicianId, date);
                
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id) {

        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }

        return ticketService.getTicketById(email, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(java.util.Map.of("message", "Ticket not found or access denied.")));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Long> payload) {

        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }

        Long technicianId = payload.get("technicianId");

        return ticketService.assignTechnician(email, id, technicianId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of("message", "Unable to assign technician. You may not be authorized or the technician is invalid.")));
    }
