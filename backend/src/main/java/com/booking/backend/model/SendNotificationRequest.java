package com.booking.backend.model;

import lombok.Data;

@Data
public class SendNotificationRequest {
    private String message;
    private NotificationType type;
    private String target;
    private String expiresIn;
}
