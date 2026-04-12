package com.booking.backend.service;

import com.booking.backend.model.*;
import com.booking.backend.repository.ReservationRepository;
import com.booking.backend.repository.ResourceRepository;
import com.booking.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReservationResponse createReservation(String userEmail, Long resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CampusResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (!resource.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("This resource is currently not available for booking.");
        }

        // Conflict check (only against CONFIRMED/PENDING, not cancelled)
        List<ResourceReservation> conflicts = reservationRepository.findConflicts(resource, date, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("This resource is already reserved for the selected time slot.");
        }

        ResourceReservation reservation = ResourceReservation.builder()
                .user(user)
                .resource(resource)
                .reservationDate(date)
                .startTime(startTime)
                .endTime(endTime)
                .status("PENDING")
                .build();

        ResourceReservation saved = reservationRepository.save(reservation);

        // Notify the user that their booking is pending review
        notificationService.sendToUser(user,
                String.format("📋 Booking request received for %s on %s (%s–%s). Awaiting admin approval.",
                        resource.getName(), date, startTime, endTime),
                NotificationType.NOTIFICATION, "7DAY");

        return ReservationResponse.from(saved);
    }

    @Transactional
    public ReservationResponse confirmReservation(Long id) {
        ResourceReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!"PENDING".equals(reservation.getStatus())) {
            throw new RuntimeException("Only PENDING reservations can be confirmed.");
        }

        reservation.setStatus("CONFIRMED");
        ResourceReservation saved = reservationRepository.save(reservation);

        // Notify the student
        notificationService.sendToUser(reservation.getUser(),
                String.format("✅ Booking Confirmed! Your seat %s on %s (%s–%s) at %s has been confirmed by the admin.",
                        reservation.getResource().getName(),
                        reservation.getReservationDate(),
                        reservation.getStartTime(),
                        reservation.getEndTime(),
                        reservation.getResource().getLocation()),
                NotificationType.NOTIFICATION, "7DAY");

        return ReservationResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reservationRepository.findByUser(user).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAllWithDetails().stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @Transactional
    public void cancelReservation(Long id, String userEmail, boolean isAdmin, String reason) {
        ResourceReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!isAdmin && !reservation.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Unauthorized to cancel this reservation");
        }

        if ("CANCELLED".equals(reservation.getStatus())) {
            throw new RuntimeException("Reservation is already cancelled.");
        }

        reservation.setStatus("CANCELLED");
        reservation.setCancellationReason(reason);
        reservationRepository.save(reservation);

        // If admin cancelled → notify the student with the reason
        if (isAdmin) {
            String msg = String.format("❌ Booking Cancelled: Your reservation for %s on %s (%s–%s) was cancelled by an admin.%s",
                    reservation.getResource().getName(),
                    reservation.getReservationDate(),
                    reservation.getStartTime(),
                    reservation.getEndTime(),
                    reason != null && !reason.isBlank() ? " Reason: " + reason : "");
            notificationService.sendToUser(reservation.getUser(), msg, NotificationType.ALERT, "7DAY");
        } else {
            // Student self-cancelled: notify them to confirm
            String msg = String.format("🗑️ Booking Cancelled: Your reservation for %s on %s (%s–%s) has been cancelled.%s",
                    reservation.getResource().getName(),
                    reservation.getReservationDate(),
                    reservation.getStartTime(),
                    reservation.getEndTime(),
                    reason != null && !reason.isBlank() ? " Reason: " + reason : "");
            notificationService.sendToUser(reservation.getUser(), msg, NotificationType.NOTIFICATION, "3DAY");
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getBookedResourceIds(LocalDate date, LocalTime startTime, LocalTime endTime) {
        return reservationRepository.findBookedResourceIds(date, startTime, endTime);
    }
}
// Logic for resource allocation implemented
