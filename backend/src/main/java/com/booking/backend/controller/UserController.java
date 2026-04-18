package com.booking.backend.controller;

import com.booking.backend.model.Role;
import com.booking.backend.model.User;
import com.booking.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/admin/users
     * Returns all registered users. Accessible by ADMIN only.
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    /**
     * GET /api/admin/technicians
     * Returns all users with TECHNICIAN role. Accessible by ADMIN only.
     */
    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllTechnicians() {
        return userService.getAllUsers().stream()
                .filter(user -> user.getRole() == Role.TECHNICIAN)
                .toList();
    }
}
