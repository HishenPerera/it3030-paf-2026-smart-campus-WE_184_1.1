package com.booking.backend.service;

import com.booking.backend.model.Ticket;
import com.booking.backend.model.User;
import com.booking.backend.model.NotificationType;
import com.booking.backend.model.Role;
import com.booking.backend.repository.TicketRepository;
import com.booking.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    // Directory relative to current working dir of the java process
    private final String uploadDir = "uploads/tickets/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final List<String> ALLOWED_FILE_TYPES = List.of("image/png", "image/jpeg", "image/jpg", "image/gif");

    public Ticket createTicket(String email, String resourceOrLocation, String category,
                               String description, String priority, String contactDetails,
                               List<MultipartFile> files) throws IOException {
        
        List<String> imageUrls = new ArrayList<>();
        
        if (files != null && !files.isEmpty()) {
            if (files.size() > 3) {
                throw new IllegalArgumentException("A maximum of 3 images are allowed.");
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                validateImageFile(file);
                
                String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
                String extension = "";
                if(originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                
                String filename = UUID.randomUUID().toString() + extension;
                Path filePath = uploadPath.resolve(filename);
                
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                
                imageUrls.add("/uploads/tickets/" + filename);
            }
        }
        
        User user = null;
        if (email != null) {
             user = userRepository.findByEmail(email).orElse(null);
        }
        
        Ticket ticket = Ticket.builder()
                .resourceOrLocation(resourceOrLocation)
                .category(category)
                .description(description)
                .priority(priority)
                .contactDetails(contactDetails)
                .imageUrls(imageUrls)
                .user(user)
                .build();

        Ticket saved = ticketRepository.save(ticket);

        // Notify admins that a new ticket was created
        notificationService.sendToRole(
                Role.ADMIN,
                "New incident ticket #" + saved.getId() + " reported: " + saved.getResourceOrLocation() + " (" + saved.getPriority() + ")",
                NotificationType.NOTIFICATION,
                null
        );

        return saved;
    }

    private void validateImageFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Each image must be 5MB or smaller.");
        }
        if (!ALLOWED_FILE_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only PNG, JPEG, JPG, and GIF images are allowed.");
        }
    }

    public List<Ticket> getTicketsFiltered(String email, String status, String priority, 
                                           String category, String resource, 
                                           Long assignedTechnicianId, String search,
                                           String startDate, String endDate) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null) return new ArrayList<>();

        org.springframework.data.jpa.domain.Specification<Ticket> spec = (root, query, cb) -> cb.conjunction();

        // Role-based visibility isolation
        if (requestUser.getRole() == com.booking.backend.model.Role.USER) {
            spec = spec.and(com.booking.backend.repository.TicketSpecification.isCreatedBy(requestUser.getId()));
        } else if (requestUser.getRole() == com.booking.backend.model.Role.TECHNICIAN) {
            spec = spec.and(com.booking.backend.repository.TicketSpecification.hasAssignedTechnician(requestUser.getId()));
        }
        // ADMIN has no baseline restrictions

        // User driven Dynamic Filters
        spec = spec.and(com.booking.backend.repository.TicketSpecification.hasStatus(status))
                   .and(com.booking.backend.repository.TicketSpecification.hasPriority(priority))
                   .and(com.booking.backend.repository.TicketSpecification.hasCategory(category))
                   .and(com.booking.backend.repository.TicketSpecification.containsResource(resource))
                   .and(com.booking.backend.repository.TicketSpecification.hasAssignedTechnician(assignedTechnicianId))
                   .and(com.booking.backend.repository.TicketSpecification.matchesSearch(search))
                   .and(com.booking.backend.repository.TicketSpecification.createdBetween(startDate, endDate));

        return ticketRepository.findAll(spec);
    }

    public Optional<Ticket> removeTicketAttachment(String email, Long ticketId, String imageUrl) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null) {
            return Optional.empty();
        }

        Optional<Ticket> optionalTicket = ticketRepository.findById(ticketId);
        if (optionalTicket.isEmpty()) {
            return Optional.empty();
        }

        Ticket ticket = optionalTicket.get();
        boolean isAdmin = requestUser.getRole() == com.booking.backend.model.Role.ADMIN;
        boolean isOwner = ticket.getUser() != null && ticket.getUser().getId().equals(requestUser.getId());
        boolean isAssignedTech = ticket.getAssignedTechnician() != null && ticket.getAssignedTechnician().getId().equals(requestUser.getId());

        if (!(isAdmin || isOwner || isAssignedTech)) {
            return Optional.empty();
        }

        if (ticket.getImageUrls() == null || !ticket.getImageUrls().contains(imageUrl)) {
            return Optional.empty();
        }

        ticket.getImageUrls().remove(imageUrl);

        try {
            String fileName = imageUrl;
            if (fileName.startsWith("/uploads/tickets/")) {
                fileName = fileName.substring("/uploads/tickets/".length());
            } else if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
                int lastSlash = fileName.lastIndexOf('/');
                if (lastSlash >= 0) {
                    fileName = fileName.substring(lastSlash + 1);
                }
            }
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(fileName).normalize();
            if (filePath.startsWith(uploadPath) && Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException ignored) {
        }

        return Optional.of(ticketRepository.save(ticket));
    }

    public Optional<Ticket> getTicketById(String email, Long ticketId) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null) {
            return Optional.empty();
        }

        Optional<Ticket> optionalTicket = ticketRepository.findById(ticketId);
        if (optionalTicket.isEmpty()) {
            return Optional.empty();
        }

        Ticket ticket = optionalTicket.get();
        if (requestUser.getRole() == com.booking.backend.model.Role.ADMIN) {
            return Optional.of(ticket);
        }

        boolean isOwner = ticket.getUser() != null && ticket.getUser().getId().equals(requestUser.getId());
        boolean isAssignedTech = ticket.getAssignedTechnician() != null && ticket.getAssignedTechnician().getId().equals(requestUser.getId());
        if (isOwner || isAssignedTech) {
            return Optional.of(ticket);
        }

        return Optional.empty();
    }

    public Optional<Ticket> updateTicketStatus(String email, Long ticketId, String newStatus, String rejectionReason, String resolutionNotes) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null) {
            return Optional.empty();
        }

        Optional<Ticket> optionalTicket = ticketRepository.findById(ticketId);
        if (optionalTicket.isEmpty()) {
            return Optional.empty();
        }

        Ticket ticket = optionalTicket.get();
        boolean isAdmin = requestUser.getRole() == com.booking.backend.model.Role.ADMIN;
        boolean isTechnician = requestUser.getRole() == com.booking.backend.model.Role.TECHNICIAN;
        boolean isAssignedTech = ticket.getAssignedTechnician() != null && ticket.getAssignedTechnician().getId().equals(requestUser.getId());

        if (!(isAdmin || (isTechnician && isAssignedTech))) {
            return Optional.empty();
        }

        if (newStatus == null || newStatus.isBlank()) {
            return Optional.empty();
        }

        String normalizedCurrent = normalizeStatus(ticket.getStatus());
        String normalizedNext = normalizeStatus(newStatus);
        if (normalizedNext == null) {
            return Optional.empty();
        }

        if ("REJECTED".equals(normalizedNext) && !isAdmin) {
            return Optional.empty();
        }

        if (!isAdmin) {
            if (!isValidTechnicianTransition(normalizedCurrent, normalizedNext)) {
                return Optional.empty();
            }
        } else {
            if (!isValidAdminTransition(normalizedCurrent, normalizedNext)) {
                return Optional.empty();
            }
        }

        if ("REJECTED".equals(normalizedNext) && (rejectionReason == null || rejectionReason.isBlank())) {
            return Optional.empty();
        }

        if ("RESOLVED".equals(normalizedNext) && (resolutionNotes == null || resolutionNotes.isBlank())) {
            return Optional.empty();
        }

        ticket.setStatus(formatStatus(normalizedNext));
        if ("REJECTED".equals(normalizedNext)) {
            ticket.setRejectionReason(rejectionReason);
            ticket.setResolutionNotes(null);
            ticket.setResolvedAt(null);
        } else if ("RESOLVED".equals(normalizedNext)) {
            ticket.setResolutionNotes(resolutionNotes);
            ticket.setRejectionReason(null);
            ticket.setResolvedAt(LocalDateTime.now());
        } else {
            ticket.setRejectionReason(null);
            ticket.setResolutionNotes(null);
            if (!"CLOSED".equals(normalizedNext)) {
                ticket.setResolvedAt(null);
            }
        }

        Ticket saved = ticketRepository.save(ticket);

        // Notify ticket owner about status changes
        if (saved.getUser() != null && saved.getUser().getId() != null) {
            notificationService.sendToUser(
                    saved.getUser(),
                    "Ticket #" + saved.getId() + " status changed to " + saved.getStatus() + ".",
                    NotificationType.NOTIFICATION,
                    null
            );
        }

        return Optional.of(saved);
    }

    private String normalizeStatus(String status) {
        if (status == null) return null;
        switch (status.trim().toUpperCase().replace(' ', '_')) {
            case "OPEN": return "OPEN";
            case "IN_PROGRESS": return "IN_PROGRESS";
            case "RESOLVED": return "RESOLVED";
            case "CLOSED": return "CLOSED";
            case "REJECTED": return "REJECTED";
            default: return null;
        }
    }

    private boolean isValidTechnicianTransition(String current, String next) {
        if (current == null) return false;
        return switch (current) {
            case "OPEN" -> "IN_PROGRESS".equals(next);
            case "IN_PROGRESS" -> "RESOLVED".equals(next);
            case "RESOLVED" -> "CLOSED".equals(next);
            default -> false;
        };
    }

    private boolean isValidAdminTransition(String current, String next) {
        if (current == null) return false;
        return switch (current) {
            case "OPEN" -> List.of("IN_PROGRESS", "REJECTED").contains(next);
            case "IN_PROGRESS" -> List.of("RESOLVED", "REJECTED").contains(next);
            case "RESOLVED" -> List.of("CLOSED", "REJECTED").contains(next);
            default -> false;
        };
    }

    private String formatStatus(String normalizedStatus) {
        return switch (normalizedStatus) {
            case "OPEN" -> "Open";
            case "IN_PROGRESS" -> "In Progress";
            case "RESOLVED" -> "Resolved";
            case "CLOSED" -> "Closed";
            case "REJECTED" -> "Rejected";
            default -> normalizedStatus;
        };
    }

    public Optional<Ticket> assignTechnician(String email, Long ticketId, Long technicianId) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null || requestUser.getRole() != com.booking.backend.model.Role.ADMIN) {
            return Optional.empty();
        }

        Optional<Ticket> optionalTicket = ticketRepository.findById(ticketId);
        if (optionalTicket.isEmpty()) {
            return Optional.empty();
        }

        User technician = null;
        if (technicianId != null) {
            technician = userRepository.findById(technicianId).orElse(null);
            if (technician == null || technician.getRole() != com.booking.backend.model.Role.TECHNICIAN) {
                return Optional.empty();
            }
        }

        Ticket ticket = optionalTicket.get();
        ticket.setAssignedTechnician(technician);
        Ticket saved = ticketRepository.save(ticket);

        // Notify assigned technician (if any) and the ticket owner
        if (technician != null) {
            notificationService.sendToUser(
                    technician,
                    "You have been assigned to ticket #" + saved.getId() + " (" + saved.getResourceOrLocation() + ").",
                    NotificationType.NOTIFICATION,
                    null
            );
        }
        if (saved.getUser() != null) {
            String msg = (technician != null)
                    ? "Your ticket #" + saved.getId() + " has been assigned to a technician."
                    : "Your ticket #" + saved.getId() + " has been unassigned.";
            notificationService.sendToUser(saved.getUser(), msg, NotificationType.NOTIFICATION, null);
        }

        return Optional.of(saved);
    }

    public TicketStatistics getTicketStatistics(String email) {
        User requestUser = null;
        if (email != null) {
            requestUser = userRepository.findByEmail(email).orElse(null);
        }
        if (requestUser == null) {
            return new TicketStatistics(0L, 0L, 0L, 0L, "N/A");
        }

        org.springframework.data.jpa.domain.Specification<Ticket> spec = (root, query, cb) -> cb.conjunction();
        if (requestUser.getRole() == com.booking.backend.model.Role.USER) {
            spec = spec.and(com.booking.backend.repository.TicketSpecification.isCreatedBy(requestUser.getId()));
        } else if (requestUser.getRole() == com.booking.backend.model.Role.TECHNICIAN) {
            spec = spec.and(com.booking.backend.repository.TicketSpecification.hasAssignedTechnician(requestUser.getId()));
        }

        List<Ticket> tickets = ticketRepository.findAll(spec);
        long openCount = tickets.stream().filter(t -> "Open".equalsIgnoreCase(t.getStatus())).count();
        long inProgressCount = tickets.stream().filter(t -> "In Progress".equalsIgnoreCase(t.getStatus())).count();
        long resolvedCount = tickets.stream().filter(t -> "Resolved".equalsIgnoreCase(t.getStatus())).count();
        long highPriorityCount = tickets.stream().filter(t -> {
            String priority = t.getPriority();
            return "High".equalsIgnoreCase(priority) || "Critical".equalsIgnoreCase(priority);
        }).count();

        double averageResolutionHours = tickets.stream()
                .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
                .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes() / 60.0)
                .average()
                .orElse(0.0);

        String averageResolutionTime = formatDuration(averageResolutionHours);
        if (averageResolutionHours <= 0) {
            averageResolutionTime = "N/A";
        }

        return new TicketStatistics(openCount, inProgressCount, resolvedCount, highPriorityCount, averageResolutionTime);
    }

    private String formatDuration(double hours) {
        if (hours <= 0) {
            return "N/A";
        }
        long totalMinutes = Math.round(hours * 60);
        long days = totalMinutes / 1440;
        long remainingMinutes = totalMinutes % 1440;
        long hrs = remainingMinutes / 60;
        long mins = remainingMinutes % 60;
        StringBuilder builder = new StringBuilder();
        if (days > 0) {
            builder.append(days).append("d ");
        }
        if (hrs > 0) {
            builder.append(hrs).append("h ");
        }
        if (mins > 0 || builder.isEmpty()) {
            builder.append(mins).append("m");
        }
        return builder.toString().trim();
    }
}
