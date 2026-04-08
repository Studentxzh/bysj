package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Student;
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
@RequestMapping("/api/admin/students")
public class AdminStudentController {

    private final StudentMapper studentMapper;
    private final AdminMapper adminMapper;

    public AdminStudentController(StudentMapper studentMapper, AdminMapper adminMapper) {
        this.studentMapper = studentMapper;
        this.adminMapper = adminMapper;
    }

    @GetMapping
    public List<User> listStudents() {
        return studentMapper.findAll().stream()
                .map(User::fromStudent)
                .collect(Collectors.toList());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                             @RequestParam Integer status) {
        studentMapper.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<User> createStudent(@RequestBody User body) {
        if (body.getUsername() == null || body.getUsername().isBlank()
                || body.getPassword() == null || body.getPassword().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (studentMapper.findByUsername(body.getUsername()) != null
                || adminMapper.findByUsername(body.getUsername()) != null) {
            return ResponseEntity.badRequest().build();
        }
        Student s = new Student();
        s.setUsername(body.getUsername().trim());
        s.setPassword(body.getPassword());
        s.setRealName(blankToEmpty(body.getRealName()));
        s.setPhone(blankToNull(body.getPhone()));
        s.setCollege(blankToNull(body.getCollege()));
        s.setMajor(blankToNull(body.getMajor()));
        s.setClassName(blankToNull(body.getClassName()));
        s.setStatus(body.getStatus() != null ? body.getStatus() : 1);
        studentMapper.insert(s);
        User resp = User.fromStudent(s);
        resp.setPassword(null);
        return ResponseEntity.ok(resp);
    }

    private static String blankToEmpty(String v) {
        if (v == null || v.isBlank()) {
            return "";
        }
        return v.trim();
    }

    private static String blankToNull(String v) {
        if (v == null || v.isBlank()) {
            return null;
        }
        return v.trim();
    }
}
