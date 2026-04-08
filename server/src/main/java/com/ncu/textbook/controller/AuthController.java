package com.ncu.textbook.controller;

import com.ncu.textbook.dto.LoginRequest;
import com.ncu.textbook.dto.LoginResponse;
import com.ncu.textbook.entity.Admin;
import com.ncu.textbook.entity.Student;
import com.ncu.textbook.mapper.AdminMapper;
import com.ncu.textbook.mapper.StudentMapper;
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

    private final StudentMapper studentMapper;
    private final AdminMapper adminMapper;

    public AuthController(StudentMapper studentMapper, AdminMapper adminMapper) {
        this.studentMapper = studentMapper;
        this.adminMapper = adminMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Student student = studentMapper.findByUsername(request.getUsername());
        if (student != null) {
            return buildLoginResponse(student.getPassword(), request.getPassword(),
                    student.getStatus(),
                    new LoginResponse(student.getId(), student.getUsername(), student.getRealName(), "student"));
        }
        Admin admin = adminMapper.findByUsername(request.getUsername());
        if (admin != null) {
            return buildLoginResponse(admin.getPassword(), request.getPassword(),
                    admin.getStatus(),
                    new LoginResponse(admin.getId(), admin.getUsername(), admin.getRealName(), "admin"));
        }
        Map<String, Object> body = new HashMap<>();
        body.put("message", "用户名或密码错误");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    private ResponseEntity<?> buildLoginResponse(String storedPassword, String requestPassword,
                                                 Integer status, LoginResponse success) {
        if (storedPassword == null || !storedPassword.equals(requestPassword)) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }
        if (status != null && status == 0) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "账户已被禁用，请联系管理员");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }
        return ResponseEntity.ok(success);
    }
}
