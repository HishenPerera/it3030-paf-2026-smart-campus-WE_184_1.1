package com.booking.backend.controller;
 
import com.booking.backend.model.ReservationResponse;
import com.booking.backend.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
 
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {
 
    private final ReservationService reservationService;
 
    @GetMapping("/my")
    public ResponseEntity<?> getMyReservations(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String email = principal.getAttribute("email");
        return ResponseEntity.ok(reservationService.getMyReservations(email));
    }
 
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllReservations(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return ResponseEntity.ok(reservationService.getAllReservations());
    }
 
    @PostMapping
    public ResponseEntity<?> createReservation(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> body) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            String email = principal.getAttribute("email");
            Long resourceId = Long.valueOf(body.get("resourceId").toString());
            LocalDate date = LocalDate.parse(body.get("reservationDate").toString());
            LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
            LocalTime endTime = LocalTime.parse(body.get("endTime").toString());
 
            ReservationResponse response = reservationService.createReservation(email, resourceId, date, startTime, endTime);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
 
    /** Admin-only: confirm a pending reservation */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirmReservation(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            ReservationResponse response = reservationService.confirmReservation(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
 
    /** Cancel a reservation (user cancels their own; admin can cancel any) - accepts optional reason */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelReservation(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            String email = principal.getAttribute("email");
            boolean isAdmin = principal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            String reason = (body != null) ? body.getOrDefault("reason", "") : "";
 
            reservationService.cancelReservation(id, email, isAdmin, reason);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
 
    @GetMapping("/availability")
    public ResponseEntity<?> getAvailability(
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            LocalDate d = LocalDate.parse(date);
            LocalTime st = LocalTime.parse(startTime);
            LocalTime et = LocalTime.parse(endTime);
            List<Long> bookedIds = reservationService.getBookedResourceIds(d, st, et);
            return ResponseEntity.ok(bookedIds);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}