package com.booking.backend.model;

import java.time.LocalDateTime;

public interface NotificationBatchSummary {
    String getBatchId();
    String getMessage();
    NotificationType getType();
    LocalDateTime getCreatedAt();
    LocalDateTime getExpiresAt();
    Long getCount();
}
