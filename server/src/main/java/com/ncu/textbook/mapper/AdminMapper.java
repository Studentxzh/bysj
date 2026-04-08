package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.Admin;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AdminMapper {

    @Select("SELECT * FROM sys_admin WHERE username = #{username}")
    Admin findByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_admin WHERE id = #{id}")
    Admin findById(@Param("id") Long id);

    @Select("SELECT * FROM sys_admin ORDER BY create_time DESC")
    List<Admin> findAll();

    @Update("UPDATE sys_admin SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Update("UPDATE sys_admin SET real_name = #{realName} WHERE id = #{id}")
    int updateRealName(@Param("id") Long id, @Param("realName") String realName);

    @Update("UPDATE sys_admin SET password = #{password} WHERE id = #{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    @Insert("""
            INSERT INTO sys_admin
            (username, password, real_name, status, create_time, update_time)
            VALUES
            (#{username}, #{password}, #{realName}, #{status}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Admin admin);
}
