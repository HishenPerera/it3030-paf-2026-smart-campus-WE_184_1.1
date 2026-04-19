package com.booking.backend.service;

import com.booking.backend.model.NotificationType;
import com.booking.backend.model.ResourceReservation;
import com.booking.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Scheduled service that automatically marks PENDING/CONFIRMED reservations
 * as COMPLETED once their slot end time has passed, using the server's system clock.
 *
 * Runs every 60 seconds.
 *
 * Lifecycle:  PENDING → CONFIRMED → COMPLETED (auto)
 *                     ↘ CANCELLED (manual)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationExpiryService {

    private final ReservationRepository reservationRepository;
    private final NotificationService   notificationService;

    /**
     * Fires every 60 seconds.
     * Finds every PENDING or CONFIRMED reservation whose slot has ended
     * (past date, or today with endTime ≤ now) and marks them COMPLETED.
     * Also sends the student a one-time notification confirming slot completion.
     */
    @Scheduled(fixedDelay = 60_000)   // 60 seconds between runs
    @Transactional
    public void expireFinishedReservations() {
        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();

        List<ResourceReservation> expired =
                reservationRepository.findExpiredReservations(today, now);

        if (expired.isEmpty()) return;

        log.info("[ReservationExpiry] Found {} reservation(s) to expire at {} {}",
                expired.size(), today, now);

        for (ResourceReservation r : expired) {
            r.setStatus("COMPLETED");
            reservationRepository.save(r);

            // Notify the student that their slot has ended and the seat is released
            notificationService.sendToUser(
                    r.getUser(),
                    String.format("✅ Your booking for %s on %s (%s–%s) is now complete. " +
                                    "The seat has been automatically released.",
                            r.getResource().getName(),
                            r.getReservationDate(),
                            r.getStartTime().toString().substring(0, 5),
                            r.getEndTime().toString().substring(0, 5)),
                    NotificationType.NOTIFICATION,
                    "3DAY"
            );

            log.info("[ReservationExpiry] Reservation #{} (resource={}, user={}) → COMPLETED",
                    r.getId(),
                    r.getResource().getName(),
                    r.getUser().getEmail());
        }
    }
}
