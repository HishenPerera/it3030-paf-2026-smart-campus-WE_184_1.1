package com.booking.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private String resourceOrLocation;
    private String category;
    private String description;
    private String priority;
    private String contactDetails;
    private List<String> imageUrls;
    private String resolutionNotes;
    private String rejectionReason;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private String status;
    private UserSummary user;
    private UserSummary assignedTechnician;

    public static TicketResponse from(Ticket ticket) {
        if (ticket == null) {
            return null;
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .resourceOrLocation(ticket.getResourceOrLocation())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .contactDetails(ticket.getContactDetails())
                .imageUrls(ticket.getImageUrls() != null ? new ArrayList<>(ticket.getImageUrls()) : new ArrayList<>())
                .resolutionNotes(ticket.getResolutionNotes())
                .rejectionReason(ticket.getRejectionReason())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .status(ticket.getStatus())
                .user(UserSummary.from(ticket.getUser()))
                .assignedTechnician(UserSummary.from(ticket.getAssignedTechnician()))
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String email;
        private String name;
        private String picture;
        private Role role;

        public static UserSummary from(User user) {
            if (user == null) {
                return null;
            }

            return UserSummary.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .picture(user.getPicture())
                    .role(user.getRole())
                    .build();
        }
    }
}
