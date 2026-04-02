package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    User findByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_user WHERE id = #{id}")
    User findById(@Param("id") Long id);

    @Select("SELECT * FROM sys_user ORDER BY create_time DESC")
    List<User> findAll();

    @Update("UPDATE sys_user SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Update("UPDATE sys_user SET role = #{role} WHERE id = #{id}")
    int updateRole(@Param("id") Long id, @Param("role") String role);

    @Update("UPDATE sys_user SET real_name = #{realName} WHERE id = #{id}")
    int updateRealName(@Param("id") Long id, @Param("realName") String realName);

    @Update("UPDATE sys_user SET password = #{password} WHERE id = #{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    @Insert("""
            INSERT INTO sys_user
            (username, password, real_name, phone, college, major, class_name, role, status, create_time, update_time)
            VALUES
            (#{username}, #{password}, #{realName}, #{phone}, #{college}, #{major}, #{className}, #{role}, #{status}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);
}

