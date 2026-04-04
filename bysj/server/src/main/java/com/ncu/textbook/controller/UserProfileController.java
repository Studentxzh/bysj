package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.entity.User;
import com.ncu.textbook.mapper.TextbookMapper;
import com.ncu.textbook.mapper.UserMapper;
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

    private final UserMapper userMapper;
    private final TextbookMapper textbookMapper;

    public UserProfileController(UserMapper userMapper, TextbookMapper textbookMapper) {
        this.userMapper = userMapper;
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
        userMapper.updateRealName(userId, realName);
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
        User user = userMapper.findById(userId);
        if (user == null || user.getPassword() == null
                || !user.getPassword().equals(oldPassword)) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "原密码不正确");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }
        userMapper.updatePassword(userId, newPassword);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/textbooks")
    public List<Textbook> myTextbooks(@RequestParam("userId") Long userId) {
        return textbookMapper.findByUserId(userId);
    }

    @GetMapping("/contact")
    public ResponseEntity<Map<String, String>> contact(@RequestParam("userId") Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("realName", user.getRealName());
        resp.put("phone", user.getPhone());
        return ResponseEntity.ok(resp);
    }
}

