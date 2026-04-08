package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Admin;
import com.ncu.textbook.entity.Student;
import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.mapper.AdminMapper;
import com.ncu.textbook.mapper.StudentMapper;
import com.ncu.textbook.mapper.TextbookMapper;
import com.ncu.textbook.util.AccountIds;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserProfileController {

    private final StudentMapper studentMapper;
    private final AdminMapper adminMapper;
    private final TextbookMapper textbookMapper;

    public UserProfileController(StudentMapper studentMapper,
                                 AdminMapper adminMapper,
                                 TextbookMapper textbookMapper) {
        this.studentMapper = studentMapper;
        this.adminMapper = adminMapper;
        this.textbookMapper = textbookMapper;
    }

    @PatchMapping("/name")
    public ResponseEntity<?> updateName(@RequestBody Map<String, String> body) {
        String userIdStr = body.get("userId");
        String realName = body.get("realName");
        if (userIdStr == null || realName == null || realName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = Long.valueOf(userIdStr);
        if (AccountIds.isAdminId(userId)) {
            adminMapper.updateRealName(userId, realName);
        } else {
            studentMapper.updateRealName(userId, realName);
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body) {
        String userIdStr = body.get("userId");
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (userIdStr == null || oldPassword == null || newPassword == null
                || oldPassword.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = Long.valueOf(userIdStr);
        if (AccountIds.isAdminId(userId)) {
            Admin admin = adminMapper.findById(userId);
            if (admin == null || admin.getPassword() == null
                    || !admin.getPassword().equals(oldPassword)) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("message", "原密码不正确");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
            }
            adminMapper.updatePassword(userId, newPassword);
        } else {
            Student student = studentMapper.findById(userId);
            if (student == null || student.getPassword() == null
                    || !student.getPassword().equals(oldPassword)) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("message", "原密码不正确");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
            }
            studentMapper.updatePassword(userId, newPassword);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/textbooks")
    public List<Textbook> myTextbooks(@RequestParam("userId") Long userId) {
        return textbookMapper.findByUserId(userId);
    }

    @GetMapping("/contact")
    public ResponseEntity<Map<String, String>> contact(@RequestParam("userId") Long userId) {
        if (AccountIds.isAdminId(userId)) {
            return ResponseEntity.notFound().build();
        }
        Student student = studentMapper.findById(userId);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("realName", student.getRealName());
        resp.put("phone", student.getPhone());
        return ResponseEntity.ok(resp);
    }
}
