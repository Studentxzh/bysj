package com.ncu.textbook.controller;

import com.ncu.textbook.dto.CreateTextbookReportRequest;
import com.ncu.textbook.entity.Student;
import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.entity.TextbookReport;
import com.ncu.textbook.mapper.StudentMapper;
import com.ncu.textbook.mapper.TextbookMapper;
import com.ncu.textbook.mapper.TextbookReportMapper;
import com.ncu.textbook.util.AccountIds;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/textbooks")
public class TextbookReportController {

    private static final int MAX_DETAIL_LEN = 1000;

    private static final Set<String> ALLOWED_REASONS = Set.of(
            "FAKE_INFO", "SPAM", "INAPPROPRIATE", "OTHER"
    );

    private final TextbookMapper textbookMapper;
    private final TextbookReportMapper reportMapper;
    private final StudentMapper studentMapper;

    public TextbookReportController(TextbookMapper textbookMapper,
                                    TextbookReportMapper reportMapper,
                                    StudentMapper studentMapper) {
        this.textbookMapper = textbookMapper;
        this.reportMapper = reportMapper;
        this.studentMapper = studentMapper;
    }

    @PostMapping("/{textbookId}/reports")
    public ResponseEntity<?> create(@PathVariable Long textbookId,
                                    @RequestBody CreateTextbookReportRequest req) {
        Textbook tb = textbookMapper.findById(textbookId);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.getReporterId() == null || AccountIds.isAdminId(req.getReporterId())) {
            return badRequest("仅学生用户可提交举报");
        }
        Student stu = studentMapper.findById(req.getReporterId());
        if (stu == null || (stu.getStatus() != null && stu.getStatus() == 0)) {
            return badRequest("用户无效或已禁用");
        }
        String reason = req.getReason() != null ? req.getReason().trim() : "";
        if (reason.isEmpty() || !ALLOWED_REASONS.contains(reason)) {
            return badRequest("请选择有效的举报类型");
        }
        String detail = req.getDetail() != null ? req.getDetail().trim() : "";
        if (detail.length() > MAX_DETAIL_LEN) {
            return badRequest("补充说明过长");
        }

        TextbookReport row = new TextbookReport();
        row.setTextbookId(textbookId);
        row.setReporterId(req.getReporterId());
        row.setReason(reason);
        row.setDetail(detail.isEmpty() ? null : detail);
        row.setStatus("PENDING");
        reportMapper.insert(row);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private static ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
