package com.booking.backend.service;

import com.booking.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Load from Google first
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Upsert to DB and get back the entity (with role)
        User user = userService.upsertUser(oAuth2User);

        // Merge DB attributes (incl. role) with Google attributes
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("role", user.getRole().name());
        attributes.put("dbId", user.getId());

        return new DefaultOAuth2User(
                Set.of(new OAuth2UserAuthority("ROLE_" + user.getRole().name(), attributes)),
                attributes,
                "email"
        );
    }
}
