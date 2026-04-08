package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.Announcement;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AnnouncementMapper {

    @Select("""
            SELECT * FROM sys_announcement
            WHERE enabled = 1
            ORDER BY sort_order ASC, create_time DESC
            """)
    List<Announcement> findPublished();

    @Select("""
            SELECT * FROM sys_announcement
            ORDER BY sort_order ASC, create_time DESC
            """)
    List<Announcement> findAll();

    @Select("SELECT * FROM sys_announcement WHERE id = #{id}")
    Announcement findById(@Param("id") Long id);

    @Insert("""
            INSERT INTO sys_announcement (title, content, enabled, sort_order, create_time, update_time)
            VALUES (#{title}, #{content}, #{enabled}, #{sortOrder}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Announcement row);

    @Update("""
            UPDATE sys_announcement
            SET title = #{title},
                content = #{content},
                enabled = #{enabled},
                sort_order = #{sortOrder},
                update_time = NOW()
            WHERE id = #{id}
            """)
    int updateById(Announcement row);

    @Delete("DELETE FROM sys_announcement WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}
