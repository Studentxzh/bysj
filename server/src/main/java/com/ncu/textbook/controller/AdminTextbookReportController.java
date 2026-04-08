package com.ncu.textbook.controller;

import com.ncu.textbook.dto.TextbookReportAdminRow;
import com.ncu.textbook.dto.TextbookReportStatusRequest;
import com.ncu.textbook.mapper.TextbookReportMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/textbook-reports")
public class AdminTextbookReportController {

    private static final Set<String> ALLOWED_STATUS = Set.of("PENDING", "PROCESSED", "REJECTED");

    private final TextbookReportMapper reportMapper;

    public AdminTextbookReportController(TextbookReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    @GetMapping
    public List<TextbookReportAdminRow> list() {
        return reportMapper.findAllForAdmin();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody TextbookReportStatusRequest req) {
        if (req.getStatus() == null || !ALLOWED_STATUS.contains(req.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        String remark = req.getAdminRemark() != null ? req.getAdminRemark().trim() : "";
        if (remark.length() > 500) {
            return ResponseEntity.badRequest().build();
        }
        int n = reportMapper.updateStatusAndRemark(id, req.getStatus(), remark.isEmpty() ? null : remark);
        if (n == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
