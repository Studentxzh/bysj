package com.ncu.textbook.controller;

import com.ncu.textbook.dto.AnnouncementRequest;
import com.ncu.textbook.entity.Announcement;
import com.ncu.textbook.mapper.AnnouncementMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/announcements")
public class AdminAnnouncementController {

    private final AnnouncementMapper announcementMapper;

    public AdminAnnouncementController(AnnouncementMapper announcementMapper) {
        this.announcementMapper = announcementMapper;
    }

    @GetMapping
    public List<Announcement> list() {
        return announcementMapper.findAll();
    }

    @PostMapping
    public ResponseEntity<Announcement> create(@RequestBody AnnouncementRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Announcement row = new Announcement();
        row.setTitle(req.getTitle().trim());
        row.setContent(req.getContent() != null ? req.getContent() : "");
        row.setEnabled(req.getEnabled() != null && req.getEnabled() == 0 ? 0 : 1);
        row.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        announcementMapper.insert(row);
        Announcement saved = announcementMapper.findById(row.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody AnnouncementRequest req) {
        Announcement existing = announcementMapper.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        existing.setTitle(req.getTitle().trim());
        existing.setContent(req.getContent() != null ? req.getContent() : "");
        existing.setEnabled(req.getEnabled() != null && req.getEnabled() == 0 ? 0 : 1);
        existing.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        announcementMapper.updateById(existing);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        int n = announcementMapper.deleteById(id);
        if (n == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
