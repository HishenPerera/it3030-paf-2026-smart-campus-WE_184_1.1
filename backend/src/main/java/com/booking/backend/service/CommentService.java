package com.booking.backend.service;

import com.booking.backend.model.Comment;
import com.booking.backend.model.Ticket;
import com.booking.backend.model.User;
import com.booking.backend.repository.CommentRepository;
import com.booking.backend.repository.TicketRepository;
import com.booking.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional
    public Optional<Comment> addComment(String email, Long ticketId, String content) {
        User author = userRepository.findByEmail(email).orElse(null);
        if (author == null) {
            return Optional.empty();
        }

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return Optional.empty();
        }

        Ticket ticket = ticketOpt.get();

        // Check if user can comment on this ticket
        boolean canComment = false;
        if (author.getRole() == com.booking.backend.model.Role.ADMIN) {
            canComment = true;
        } else if (author.getRole() == com.booking.backend.model.Role.TECHNICIAN) {
            canComment = ticket.getAssignedTechnician() != null &&
                        ticket.getAssignedTechnician().getId().equals(author.getId());
        } else if (author.getRole() == com.booking.backend.model.Role.USER) {
            canComment = ticket.getUser() != null &&
                        ticket.getUser().getId().equals(author.getId());
        }

        if (!canComment) {
            return Optional.empty();
        }

        if (content == null || content.trim().isEmpty()) {
            return Optional.empty();
        }

        Comment comment = Comment.builder()
                .content(content.trim())
                .author(author)
                .ticket(ticket)
                .build();

        return Optional.of(commentRepository.save(comment));
    }

    public List<Comment> getCommentsForTicket(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public Optional<Comment> updateComment(String email, Long ticketId, Long commentId, String newContent) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return Optional.empty();
        }

        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            return Optional.empty();
        }

        Comment comment = commentOpt.get();

        // Check if comment belongs to the ticket
        if (!comment.getTicket().getId().equals(ticketId)) {
            return Optional.empty();
        }

        // Only author can edit their own comments
        if (!comment.getAuthor().getId().equals(user.getId())) {
            return Optional.empty();
        }

        if (newContent == null || newContent.trim().isEmpty()) {
            return Optional.empty();
        }

        comment.setContent(newContent.trim());
        return Optional.of(commentRepository.save(comment));
    }

    @Transactional
    public boolean deleteComment(String email, Long ticketId, Long commentId) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }

        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            return false;
        }

        Comment comment = commentOpt.get();

        // Check if comment belongs to the ticket
        if (!comment.getTicket().getId().equals(ticketId)) {
            return false;
        }

        // Author can delete their own comments, admin can delete any comment
        boolean canDelete = comment.getAuthor().getId().equals(user.getId()) ||
                           user.getRole() == com.booking.backend.model.Role.ADMIN;

        if (canDelete) {
            commentRepository.delete(comment);
            return true;
        }

        return false;
    }
}