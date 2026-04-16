package com.booking.backend.service;

import com.booking.backend.model.Notification;
import com.booking.backend.model.NotificationType;
import com.booking.backend.model.Role;
import com.booking.backend.model.User;
import com.booking.backend.repository.NotificationRepository;
import com.booking.backend.repository.UserRepository;
import com.booking.backend.model.NotificationBatchSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private LocalDateTime calculateExpiry(String expiresIn) {
        if (expiresIn == null) return null;
        return switch (expiresIn) {
            case "1HR" -> LocalDateTime.now().plusHours(1);
            case "12HR" -> LocalDateTime.now().plusHours(12);
            case "1DAY" -> LocalDateTime.now().plusDays(1);
            case "3DAY" -> LocalDateTime.now().plusDays(3);
            case "7DAY" -> LocalDateTime.now().plusDays(7);
            default -> null;
        };
    }

    @Transactional
    public void sendToUser(User user, String message, NotificationType type, String expiresIn) {
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .user(user)
                .batchId(UUID.randomUUID().toString())
                .expiresAt(calculateExpiry(expiresIn))
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void broadcast(String message, NotificationType type, String expiresIn) {
        List<User> allUsers = userRepository.findAll();
        String batchId = UUID.randomUUID().toString();
        LocalDateTime expires = calculateExpiry(expiresIn);
        
        List<Notification> notifications = allUsers.stream()
                .map(u -> Notification.builder()
                        .message(message)
                        .type(type)
                        .user(u)
                        .batchId(batchId)
                        .expiresAt(expires)
                        .build())
                .collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void sendToRole(Role role, String message, NotificationType type, String expiresIn) {
        List<User> targetUsers = userRepository.findByRole(role);
        String batchId = UUID.randomUUID().toString();
        LocalDateTime expires = calculateExpiry(expiresIn);
        
        List<Notification> notifications = targetUsers.stream()
                .map(u -> Notification.builder()
                        .message(message)
                        .type(type)
                        .user(u)
                        .batchId(batchId)
                        .expiresAt(expires)
                        .build())
                .collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findAllByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findAllByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    // --- Admin Management ---
    public List<NotificationBatchSummary> getBroadcastBatches() {
        return notificationRepository.findDistinctBatches();
    }

    @Transactional
    public void deleteBatch(String batchId) {
        notificationRepository.deleteByBatchId(batchId);
    }

    // --- Automated Cleanup ---
    // Runs every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredNotifications() {
        notificationRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
