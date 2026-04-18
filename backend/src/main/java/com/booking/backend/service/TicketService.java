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
}
