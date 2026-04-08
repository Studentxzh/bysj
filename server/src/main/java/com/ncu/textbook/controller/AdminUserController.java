package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Admin;
import com.ncu.textbook.entity.User;
import com.ncu.textbook.mapper.AdminMapper;
import com.ncu.textbook.mapper.StudentMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminMapper adminMapper;
    private final StudentMapper studentMapper;

    public AdminUserController(AdminMapper adminMapper, StudentMapper studentMapper) {
        this.adminMapper = adminMapper;
        this.studentMapper = studentMapper;
    }

    @GetMapping
    public List<User> listUsers() {
        return adminMapper.findAll().stream()
                .map(User::fromAdmin)
                .collect(Collectors.toList());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestParam Integer status) {
        adminMapper.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User body) {
        if (body.getUsername() == null || body.getUsername().isBlank()
                || body.getPassword() == null || body.getPassword().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (studentMapper.findByUsername(body.getUsername()) != null
                || adminMapper.findByUsername(body.getUsername()) != null) {
            return ResponseEntity.badRequest().build();
        }
        Admin admin = new Admin();
        admin.setUsername(body.getUsername().trim());
        admin.setPassword(body.getPassword());
        String rn = body.getRealName();
        admin.setRealName(rn != null && !rn.isBlank() ? rn.trim() : "");
        admin.setStatus(body.getStatus() != null ? body.getStatus() : 1);
        adminMapper.insert(admin);
        User resp = User.fromAdmin(admin);
        resp.setPassword(null);
        return ResponseEntity.ok(resp);
    }
}
