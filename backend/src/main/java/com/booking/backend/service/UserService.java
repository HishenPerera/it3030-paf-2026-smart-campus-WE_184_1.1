package com.booking.backend.service;

import com.booking.backend.model.Role;
import com.booking.backend.model.User;
import com.booking.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Creates a new user or updates name/picture on every OAuth login.
     * Existing roles are preserved so an admin doesn't lose privileges on re-login.
     */
    public User upsertUser(OAuth2User oAuth2User) {
        String email   = oAuth2User.getAttribute("email");
        String name    = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        return userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setName(name);
                    existing.setPicture(picture);
                    // Also ensure they are ADMIN if they are the special user
                    if ("hishenperera@gmail.com".equalsIgnoreCase(email)) {
                        existing.setRole(Role.ADMIN);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .picture(picture)
                            .role("hishenperera@gmail.com".equalsIgnoreCase(email) ? Role.ADMIN : Role.USER)
                            .build();
                    User savedUser = userRepository.save(newUser);
                    
                    // Send welcome notification
                    notificationService.sendToUser(
                            savedUser, 
                            "Welcome to Smart Campus! We're glad to have you.", 
                            com.booking.backend.model.NotificationType.NOTIFICATION, 
                            "7DAY"
                    );
                    
                    return savedUser;
                });
    }

    /** Returns all registered users. */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /** Updates the role of a user identified by id. */
    @Transactional
    public User updateRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        Role oldRole = user.getRole();
        user.setRole(role);
        User updatedUser = userRepository.save(user);

        // Send role update notification
        if (oldRole != role) {
            notificationService.sendToUser(
                    updatedUser, 
                    "Your role has been updated to " + role.name() + ".", 
                    com.booking.backend.model.NotificationType.ALERT, 
                    "7DAY"
            );
        }

        return updatedUser;
    }

    /** Finds a user by their email. */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
