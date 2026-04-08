package com.ncu.textbook.mapper;

import com.ncu.textbook.dto.TextbookCommentAdminRow;
import com.ncu.textbook.dto.TextbookCommentView;
import com.ncu.textbook.entity.TextbookComment;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface TextbookCommentMapper {

    @Select("""
            SELECT c.id,
                   c.textbook_id AS textbookId,
                   c.user_id AS userId,
                   c.parent_id AS parentId,
                   c.content,
                   c.status,
                   c.create_time AS createTime,
                   s.real_name AS authorName
            FROM textbook_comment c
            JOIN sys_student s ON s.id = c.user_id
            WHERE c.textbook_id = #{textbookId} AND c.status = 'VISIBLE'
            ORDER BY c.create_time ASC
            """)
    List<TextbookCommentView> findVisibleByTextbookId(@Param("textbookId") Long textbookId);

    @Select("""
            SELECT c.id,
                   c.textbook_id AS textbookId,
                   t.title AS textbookTitle,
                   c.user_id AS userId,
                   s.real_name AS authorName,
                   c.parent_id AS parentId,
                   c.content,
                   c.status,
                   c.create_time AS createTime
            FROM textbook_comment c
            JOIN sys_student s ON s.id = c.user_id
            JOIN textbook t ON t.id = c.textbook_id
            ORDER BY c.create_time DESC
            """)
    List<TextbookCommentAdminRow> findAllForAdmin();

    @Select("SELECT * FROM textbook_comment WHERE id = #{id}")
    TextbookComment findById(@Param("id") Long id);

    @Insert("""
            INSERT INTO textbook_comment
            (textbook_id, user_id, parent_id, content, status, create_time)
            VALUES (#{textbookId}, #{userId}, #{parentId}, #{content}, #{status}, NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TextbookComment row);

    @Update("UPDATE textbook_comment SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") String status);

    @Delete("DELETE FROM textbook_comment WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}
