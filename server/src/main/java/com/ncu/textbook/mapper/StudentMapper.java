package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.Student;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface StudentMapper {

    @Select("SELECT * FROM sys_student WHERE username = #{username}")
    Student findByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_student WHERE id = #{id}")
    Student findById(@Param("id") Long id);

    @Select("SELECT * FROM sys_student ORDER BY create_time DESC")
    List<Student> findAll();

    @Update("UPDATE sys_student SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Update("UPDATE sys_student SET real_name = #{realName} WHERE id = #{id}")
    int updateRealName(@Param("id") Long id, @Param("realName") String realName);

    @Update("UPDATE sys_student SET password = #{password} WHERE id = #{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    @Insert("""
            INSERT INTO sys_student
            (username, password, real_name, phone, college, major, class_name, status, create_time, update_time)
            VALUES
            (#{username}, #{password}, #{realName}, #{phone}, #{college}, #{major}, #{className}, #{status}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Student student);
}
