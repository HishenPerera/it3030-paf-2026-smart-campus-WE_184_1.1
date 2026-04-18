package com.booking.backend.controller;

import com.booking.backend.model.Notification;
import com.booking.backend.model.NotificationType;
import com.booking.backend.model.Role;
import com.booking.backend.model.User;
import com.booking.backend.model.SendNotificationRequest;
import com.booking.backend.repository.UserRepository;
import com.booking.backend.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String email = principal.getAttribute("email");
        User user = getCurrentUser(email);
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String email = principal.getAttribute("email");
        User user = getCurrentUser(email);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String email = principal.getAttribute("email");
        User user = getCurrentUser(email);
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@RequestBody SendNotificationRequest request, @AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String email = principal.getAttribute("email");
        User adminUser = getCurrentUser(email);
        
        if (adminUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        NotificationType type = request.getType() != null ? request.getType() : NotificationType.NOTIFICATION;

        if ("ALL".equalsIgnoreCase(request.getTarget())) {
            notificationService.broadcast(request.getMessage(), type, request.getExpiresIn());
        } else if ("ADMINS".equalsIgnoreCase(request.getTarget())) {
            notificationService.sendToRole(Role.ADMIN, request.getMessage(), type, request.getExpiresIn());
        } else if ("USERS".equalsIgnoreCase(request.getTarget())) {
            notificationService.sendToRole(Role.USER, request.getMessage(), type, request.getExpiresIn());
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/batches")
    public ResponseEntity<List<com.booking.backend.model.NotificationBatchSummary>> getBatches(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User adminUser = getCurrentUser(principal.getAttribute("email"));
        if (adminUser.getRole() != Role.ADMIN) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(notificationService.getBroadcastBatches());
    }

    @DeleteMapping("/batches/{batchId}")
    public ResponseEntity<Void> deleteBatch(@PathVariable String batchId, @AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User adminUser = getCurrentUser(principal.getAttribute("email"));
        if (adminUser.getRole() != Role.ADMIN) return ResponseEntity.status(403).build();
        notificationService.deleteBatch(batchId);
        return ResponseEntity.ok().build();
    }
}
