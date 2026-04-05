package com.booking.backend.controller;

import com.booking.backend.model.User;
import com.booking.backend.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletResponse response) {

        if (principal == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return null;
        }

        String email = principal.getAttribute("email");
        User user = userService.getUserByEmail(email);

        // Build a combined response with DB data (including role) + Google data
        Map<String, Object> result = new HashMap<>(principal.getAttributes());
        result.put("id", user.getId());
        result.put("role", user.getRole().name());
        return result;
    }
}
