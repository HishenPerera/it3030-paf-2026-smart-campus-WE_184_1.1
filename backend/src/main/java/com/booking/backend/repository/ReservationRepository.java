package com.booking.backend.repository;

import com.booking.backend.model.ResourceReservation;
import com.booking.backend.model.CampusResource;
import com.booking.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Repository
public interface ReservationRepository extends JpaRepository<ResourceReservation, Long> {
    
    @Query("SELECT r FROM ResourceReservation r JOIN FETCH r.user JOIN FETCH r.resource WHERE r.user = :user")
    List<ResourceReservation> findByUser(@Param("user") User user);

    @Query("SELECT r FROM ResourceReservation r JOIN FETCH r.user JOIN FETCH r.resource")
    List<ResourceReservation> findAllWithDetails();

    @Query("SELECT r FROM ResourceReservation r WHERE r.resource = :resource AND r.reservationDate = :date " +
           "AND r.status NOT IN ('CANCELLED', 'COMPLETED') AND " +
           "(r.startTime < :endTime AND r.endTime > :startTime)")
    List<ResourceReservation> findConflicts(@Param("resource") CampusResource resource,
                                            @Param("date") LocalDate date,
                                            @Param("startTime") LocalTime startTime,
                                            @Param("endTime") LocalTime endTime);
    @Query("SELECT r.resource.id FROM ResourceReservation r WHERE r.reservationDate = :date " +
           "AND r.status NOT IN ('CANCELLED', 'COMPLETED') AND " +
           "(r.startTime < :endTime AND r.endTime > :startTime)")
    List<Long> findBookedResourceIds(@Param("date") LocalDate date,
                                     @Param("startTime") LocalTime startTime,
                                     @Param("endTime") LocalTime endTime);

    /**
     * Find all PENDING or CONFIRMED reservations that have expired:
     * - reservation date is in the past, OR
     * - reservation date is today AND endTime is at or before the current time
     */
    @Query("SELECT r FROM ResourceReservation r JOIN FETCH r.user JOIN FETCH r.resource " +
           "WHERE r.status IN ('PENDING', 'CONFIRMED') AND " +
           "(r.reservationDate < :today OR (r.reservationDate = :today AND r.endTime <= :now))")
    List<ResourceReservation> findExpiredReservations(@Param("today") LocalDate today,
                                                      @Param("now") LocalTime now);
}
