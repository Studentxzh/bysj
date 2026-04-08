package com.ncu.textbook.controller;

import com.ncu.textbook.dto.TextbookCommentAdminRow;
import com.ncu.textbook.dto.TextbookCommentStatusRequest;
import com.ncu.textbook.mapper.TextbookCommentMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/textbook-comments")
public class AdminTextbookCommentController {

    private static final Set<String> ALLOWED_STATUS = Set.of("VISIBLE", "HIDDEN");

    private final TextbookCommentMapper commentMapper;

    public AdminTextbookCommentController(TextbookCommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    @GetMapping
    public List<TextbookCommentAdminRow> list() {
        return commentMapper.findAllForAdmin();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestBody TextbookCommentStatusRequest req) {
        if (req.getStatus() == null || !ALLOWED_STATUS.contains(req.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        int n = commentMapper.updateStatus(id, req.getStatus());
        if (n == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        int n = commentMapper.deleteById(id);
        if (n == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
