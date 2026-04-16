package com.booking.backend.repository;

import com.booking.backend.model.Notification;
import com.booking.backend.model.NotificationBatchSummary;
import com.booking.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByUserOrderByCreatedAtDesc(User user);
    List<Notification> findAllByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    long countByUserAndIsReadFalse(User user);

    @Modifying
    void deleteByBatchId(String batchId);

    @Modifying
    void deleteByExpiresAtBefore(LocalDateTime time);

    @Query("SELECT n.batchId as batchId, MAX(n.message) as message, MAX(n.type) as type, " +
           "MAX(n.createdAt) as createdAt, MAX(n.expiresAt) as expiresAt, COUNT(n) as count " +
           "FROM Notification n " + 
           "WHERE n.batchId IS NOT NULL " +
           "GROUP BY n.batchId " +
           "ORDER BY MAX(n.createdAt) DESC")
    List<NotificationBatchSummary> findDistinctBatches();
}
