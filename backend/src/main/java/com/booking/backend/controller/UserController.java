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
     * PUT /api/admin/users/{id}/role
     * Updates the role of a specific user. Accessible by ADMIN only.
     * Request body: { "role": "ADMIN" | "USER" }
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Role role = Role.valueOf(body.get("role").toUpperCase());
        User updated = userService.updateRole(id, role);
        return ResponseEntity.ok(updated);
    }
}
