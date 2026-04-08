package com.ncu.textbook.entity;

import java.time.LocalDateTime;

/**
 * 管理后台等接口的统一 JSON 形态；数据分别来自 {@link Student}、{@link Admin} 表。
 */
public class User {

    private Long id;
    private String username;
    private String password;
    private String realName;
    private String phone;
    private String college;
    private String major;
    private String className;
    private String role;     // student / admin
    private Integer status;  // 0 禁用, 1 正常
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getMajor() {
        return major;
    }

    public void setMajor(String major) {
        this.major = major;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    public static User fromStudent(Student s) {
        if (s == null) {
            return null;
        }
        User u = new User();
        u.setId(s.getId());
        u.setUsername(s.getUsername());
        u.setPassword(s.getPassword());
        u.setRealName(s.getRealName());
        u.setPhone(s.getPhone());
        u.setCollege(s.getCollege());
        u.setMajor(s.getMajor());
        u.setClassName(s.getClassName());
        u.setRole("student");
        u.setStatus(s.getStatus());
        u.setCreateTime(s.getCreateTime());
        u.setUpdateTime(s.getUpdateTime());
        return u;
    }

    public static User fromAdmin(Admin a) {
        if (a == null) {
            return null;
        }
        User u = new User();
        u.setId(a.getId());
        u.setUsername(a.getUsername());
        u.setPassword(a.getPassword());
        u.setRealName(a.getRealName());
        u.setRole("admin");
        u.setStatus(a.getStatus());
        u.setCreateTime(a.getCreateTime());
        u.setUpdateTime(a.getUpdateTime());
        return u;
    }
}

