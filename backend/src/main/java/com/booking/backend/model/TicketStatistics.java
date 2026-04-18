package com.booking.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketStatistics {
    private Long totalOpenTickets;
    private Long ticketsInProgress;
    private Long resolvedTickets;
    private Long highPriorityIncidents;
    private String averageResolutionTime;
}
