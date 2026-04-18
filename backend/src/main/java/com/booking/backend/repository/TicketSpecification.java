package com.booking.backend.repository;

import com.booking.backend.model.Ticket;
import com.booking.backend.model.User;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public class TicketSpecification {

    public static Specification<Ticket> hasStatus(String status) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(status)) return null;
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Ticket> hasPriority(String priority) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(priority)) return null;
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<Ticket> hasCategory(String category) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(category)) return null;
            return cb.equal(root.get("category"), category);
        };
    }

    public static Specification<Ticket> containsResource(String resource) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(resource)) return null;
            return cb.like(cb.lower(root.get("resourceOrLocation")), "%" + resource.toLowerCase() + "%");
        };
    }

    public static Specification<Ticket> hasAssignedTechnician(Long technicianId) {
        return (root, query, cb) -> {
            if (technicianId == null) return null;
            Join<Ticket, User> technicianJoin = root.join("assignedTechnician");
            return cb.equal(technicianJoin.get("id"), technicianId);
        };
    }

    public static Specification<Ticket> isCreatedBy(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return null;
            Join<Ticket, User> userJoin = root.join("user");
            return cb.equal(userJoin.get("id"), userId);
        };
    }

    public static Specification<Ticket> createdOnDate(String dateStr) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(dateStr)) return null;
            LocalDate targetDate = LocalDate.parse(dateStr);
            return cb.between(root.get("createdAt"), targetDate.atStartOfDay(), targetDate.plusDays(1).atStartOfDay());
        };
    }
}
