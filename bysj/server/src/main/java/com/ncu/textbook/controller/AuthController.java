package com.ncu.textbook.controller;

import com.ncu.textbook.dto.LoginRequest;
import com.ncu.textbook.dto.LoginResponse;
import com.ncu.textbook.entity.User;
import com.ncu.textbook.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserMapper userMapper;

    public AuthController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null || user.getPassword() == null ||
                !user.getPassword().equals(request.getPassword())) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "账户已被禁用，请联系管理员");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }
        LoginResponse resp = new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getRole()
        );
        return ResponseEntity.ok(resp);
    }
}

