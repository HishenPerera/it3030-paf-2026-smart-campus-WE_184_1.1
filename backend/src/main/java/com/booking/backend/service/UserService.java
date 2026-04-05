package com.booking.backend.service;

import com.booking.backend.model.Role;
import com.booking.backend.model.User;
import com.booking.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email(email)
                                .name(name)
                                .picture(picture)
                                .role("hishenperera@gmail.com".equalsIgnoreCase(email) ? Role.ADMIN : Role.USER)
                                .build()
                ));
    }

    /** Returns all registered users. */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /** Updates the role of a user identified by id. */
    public User updateRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setRole(role);
        return userRepository.save(user);
    }

    /** Finds a user by their email. */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
