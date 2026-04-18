package com.booking.backend.repository;

import com.booking.backend.model.Ticket;
import com.booking.backend.model.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
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
            try {
                LocalDate targetDate = LocalDate.parse(dateStr);
                return cb.between(root.get("createdAt"), targetDate.atStartOfDay(), targetDate.plusDays(1).atStartOfDay());
            } catch (Exception ex) {
                return null;
            }
        };
    }

    public static Specification<Ticket> createdBetween(String startDateStr, String endDateStr) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(startDateStr) && !StringUtils.hasText(endDateStr)) return null;
            try {
                LocalDate startDate = StringUtils.hasText(startDateStr) ? LocalDate.parse(startDateStr) : null;
                LocalDate endDate = StringUtils.hasText(endDateStr) ? LocalDate.parse(endDateStr) : null;

                if (startDate != null && endDate != null) {
                    return cb.between(root.get("createdAt"), startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
                }
                if (startDate != null) {
                    return cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay());
                }
                return cb.lessThan(root.get("createdAt"), endDate.plusDays(1).atStartOfDay());
            } catch (Exception ex) {
                return null;
            }
        };
    }

    public static Specification<Ticket> matchesSearch(String searchTerms) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(searchTerms)) return null;
            String lower = "%" + searchTerms.toLowerCase() + "%";
            Predicate textMatch = cb.or(
                    cb.like(cb.lower(root.get("resourceOrLocation")), lower),
                    cb.like(cb.lower(root.get("category")), lower),
                    cb.like(cb.lower(root.get("description")), lower),
                    cb.like(cb.lower(root.get("contactDetails")), lower)
            );
            try {
                Long numericId = Long.parseLong(searchTerms.trim());
                return cb.or(textMatch, cb.equal(root.get("id"), numericId));
            } catch (NumberFormatException ignored) {
                return textMatch;
            }
        };
    }
}
