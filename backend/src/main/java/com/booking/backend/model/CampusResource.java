package com.booking.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "campus_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // e.g., "LIBRARY_SEAT", "LAB_STATION"

    @Column(nullable = false)
    private String location; // e.g., "Main Library - Level 1"

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, MAINTENANCE, UNAVAILABLE

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
