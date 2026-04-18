package com.booking.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String resourceOrLocation;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "priority_level", nullable = false)
    private String priority;

    // Compatibility: some DB schemas have a NOT NULL `priority` column
    @JsonIgnore
    @Column(name = "priority", nullable = false)
    private String priorityLegacy;

    @Column(nullable = false)
    private String contactDetails;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ticket_images", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @JsonIgnore
    private List<Comment> comments;

    @Column(length = 2000)
    private String resolutionNotes;

    @Column(length = 1000)
    private String rejectionReason;

    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technician_id")
    private User assignedTechnician;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "Open";
        }
        syncPriorityColumns();
    }

    @PreUpdate
    protected void onUpdate() {
        syncPriorityColumns();
    }

    private void syncPriorityColumns() {
        if (priority == null || priority.isBlank()) {
            priority = priorityLegacy;
        }
        if (priorityLegacy == null || priorityLegacy.isBlank()) {
            priorityLegacy = priority;
        }
        // final fallback to avoid NOT NULL insert failures
        if (priority == null || priority.isBlank()) {
            priority = "Low";
        }
        if (priorityLegacy == null || priorityLegacy.isBlank()) {
            priorityLegacy = "Low";
        }
    }
}
