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
     * Returns all users with TECHNICIAN role. Accessible by ADMIN or TECHNICIAN.
     */
    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public List<User> getAllTechnicians() {
        return userService.getAllUsers().stream()
                .filter(user -> user.getRole() == Role.TECHNICIAN)
                .toList();
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Updates the role of a user. Accessible by ADMIN only.
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
        }
        try {
            Role role = Role.valueOf(roleName.toUpperCase());
            User updated = userService.updateRole(id, role);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role: " + roleName));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
