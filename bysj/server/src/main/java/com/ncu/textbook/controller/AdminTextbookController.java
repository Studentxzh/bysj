package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.mapper.TextbookMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/textbooks")
public class AdminTextbookController {

    private final TextbookMapper textbookMapper;

    public AdminTextbookController(TextbookMapper textbookMapper) {
        this.textbookMapper = textbookMapper;
    }

    @GetMapping
    public List<Textbook> list(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return textbookMapper.findAll();
        }
        return textbookMapper.findByStatus(status);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestParam String status) {
        textbookMapper.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        textbookMapper.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

