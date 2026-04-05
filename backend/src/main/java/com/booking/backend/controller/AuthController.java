package com.booking.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class AuthController {

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletResponse response) {
        if (principal != null) {
            return principal.getAttributes();
        }
        // Return 401 so the frontend can detect unauthenticated state
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return null;
    }
}
