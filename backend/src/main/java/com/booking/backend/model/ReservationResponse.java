package com.booking.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceLocation;
    private LocalDate reservationDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String cancellationReason;
    private LocalDateTime createdAt;

    public static ReservationResponse from(ResourceReservation reservation) {
        ReservationResponseBuilder builder = ReservationResponse.builder()
                .id(reservation.getId())
                .reservationDate(reservation.getReservationDate())
                .startTime(reservation.getStartTime())
                .endTime(reservation.getEndTime())
                .status(reservation.getStatus())
                .cancellationReason(reservation.getCancellationReason())
                .createdAt(reservation.getCreatedAt());

        if (reservation.getUser() != null) {
            builder.userId(reservation.getUser().getId())
                   .userName(reservation.getUser().getName())
                   .userEmail(reservation.getUser().getEmail());
        }

        if (reservation.getResource() != null) {
            builder.resourceId(reservation.getResource().getId())
                   .resourceName(reservation.getResource().getName())
                   .resourceType(reservation.getResource().getType())
                   .resourceLocation(reservation.getResource().getLocation());
        }

        return builder.build();
    }
}
