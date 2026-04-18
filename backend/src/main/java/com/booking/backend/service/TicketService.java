package com.booking.backend.service;

import com.booking.backend.model.Ticket;
import com.booking.backend.model.User;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    
    // Directory relative to current working dir of the java process
    private final String uploadDir = "uploads/tickets/";

    public Ticket createTicket(String email, String resourceOrLocation, String category,
                               String description, String priority, String contactDetails,
                               List<MultipartFile> files) throws IOException {
        
        List<String> imageUrls = new ArrayList<>();
        
        if (files != null && !files.isEmpty()) {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                
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
                
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getTicketsFiltered(String email, String status, String priority, 
                                           String category, String resource, 
                                           Long assignedTechnicianId, String dateStr) {
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
                   .and(com.booking.backend.repository.TicketSpecification.createdOnDate(dateStr));

        return ticketRepository.findAll(spec);
    }
}
