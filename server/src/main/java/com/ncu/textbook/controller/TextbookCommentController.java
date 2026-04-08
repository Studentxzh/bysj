package com.ncu.textbook.controller;

import com.ncu.textbook.dto.CreateTextbookCommentRequest;
import com.ncu.textbook.dto.TextbookCommentView;
import com.ncu.textbook.entity.Student;
import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.entity.TextbookComment;
import com.ncu.textbook.mapper.StudentMapper;
import com.ncu.textbook.mapper.TextbookCommentMapper;
import com.ncu.textbook.mapper.TextbookMapper;
import com.ncu.textbook.util.AccountIds;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/textbooks")
public class TextbookCommentController {

    private static final int MAX_CONTENT_LEN = 2000;

    private final TextbookMapper textbookMapper;
    private final TextbookCommentMapper commentMapper;
    private final StudentMapper studentMapper;

    public TextbookCommentController(TextbookMapper textbookMapper,
                                   TextbookCommentMapper commentMapper,
                                   StudentMapper studentMapper) {
        this.textbookMapper = textbookMapper;
        this.commentMapper = commentMapper;
        this.studentMapper = studentMapper;
    }

    @GetMapping("/{textbookId}/comments")
    public ResponseEntity<List<TextbookCommentView>> list(@PathVariable Long textbookId) {
        Textbook tb = textbookMapper.findById(textbookId);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(commentMapper.findVisibleByTextbookId(textbookId));
    }

    @PostMapping("/{textbookId}/comments")
    public ResponseEntity<?> create(@PathVariable Long textbookId,
                                    @RequestBody CreateTextbookCommentRequest req) {
        Textbook tb = textbookMapper.findById(textbookId);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.getUserId() == null || AccountIds.isAdminId(req.getUserId())) {
            return badRequest("仅学生用户可发表评论");
        }
        Student stu = studentMapper.findById(req.getUserId());
        if (stu == null || (stu.getStatus() != null && stu.getStatus() == 0)) {
            return badRequest("用户无效或已禁用");
        }
        String content = req.getContent() != null ? req.getContent().trim() : "";
        if (content.isEmpty()) {
            return badRequest("评论内容不能为空");
        }
        if (content.length() > MAX_CONTENT_LEN) {
            return badRequest("评论内容过长");
        }

        Long parentId = req.getParentId();
        if (parentId != null) {
            TextbookComment parent = commentMapper.findById(parentId);
            if (parent == null || !textbookId.equals(parent.getTextbookId())) {
                return badRequest("回复目标不存在");
            }
            if (parent.getParentId() != null) {
                return badRequest("仅支持回复一级评论");
            }
        }

        TextbookComment row = new TextbookComment();
        row.setTextbookId(textbookId);
        row.setUserId(req.getUserId());
        row.setParentId(parentId);
        row.setContent(content);
        row.setStatus("VISIBLE");
        commentMapper.insert(row);

        TextbookCommentView view = new TextbookCommentView();
        view.setId(row.getId());
        view.setTextbookId(textbookId);
        view.setUserId(req.getUserId());
        view.setParentId(parentId);
        view.setContent(content);
        view.setStatus("VISIBLE");
        view.setCreateTime(LocalDateTime.now());
        view.setAuthorName(stu.getRealName() != null ? stu.getRealName() : stu.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    private static ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
