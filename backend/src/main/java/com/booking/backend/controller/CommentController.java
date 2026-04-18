package com.booking.backend.controller;

import com.booking.backend.model.Comment;
import com.booking.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<?> addComment(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> payload) {

        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }

        String content = payload.get("content");

        return commentService.addComment(email, ticketId, content)
                .<ResponseEntity<?>>map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(comment))
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unable to add comment. You may not be authorized or the content is invalid.")));
    }

    @GetMapping
    public ResponseEntity<?> getComments(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long ticketId) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        String email = principal.getAttribute("email");
        Optional<List<Comment>> comments = commentService.getCommentsForTicket(email, ticketId);
        return comments.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unable to view comments. You may not be authorized.")));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @RequestBody Map<String, String> payload) {

        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }

        String content = payload.get("content");

        return commentService.updateComment(email, ticketId, commentId, content)
                .<ResponseEntity<?>>map(updatedComment -> ResponseEntity.ok(updatedComment))
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unable to update comment. You may not be authorized or the content is invalid.")));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable Long ticketId,
            @PathVariable Long commentId) {

        String email = null;
        if (principal != null) {
            email = principal.getAttribute("email");
        }

        boolean deleted = commentService.deleteComment(email, ticketId, commentId);

        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Unable to delete comment. You may not be authorized."));
        }
    }
}