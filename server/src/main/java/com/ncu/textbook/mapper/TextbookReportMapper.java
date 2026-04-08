package com.ncu.textbook.mapper;

import com.ncu.textbook.dto.TextbookReportAdminRow;
import com.ncu.textbook.entity.TextbookReport;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface TextbookReportMapper {

    @Select("""
            SELECT r.id,
                   r.textbook_id AS textbookId,
                   t.title AS textbookTitle,
                   r.reporter_id AS reporterId,
                   s.real_name AS reporterName,
                   r.reason,
                   r.`detail` AS detail,
                   r.status,
                   r.admin_remark AS adminRemark,
                   r.create_time AS createTime,
                   r.update_time AS updateTime
            FROM textbook_report r
            JOIN textbook t ON t.id = r.textbook_id
            JOIN sys_student s ON s.id = r.reporter_id
            ORDER BY r.create_time DESC
            """)
    List<TextbookReportAdminRow> findAllForAdmin();

    @Insert("""
            INSERT INTO textbook_report
            (textbook_id, reporter_id, reason, `detail`, status, create_time, update_time)
            VALUES (#{textbookId}, #{reporterId}, #{reason}, #{detail}, #{status}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TextbookReport row);

    @Update("""
            UPDATE textbook_report
            SET status = #{status},
                admin_remark = #{adminRemark},
                update_time = NOW()
            WHERE id = #{id}
            """)
    int updateStatusAndRemark(@Param("id") Long id,
                              @Param("status") String status,
                              @Param("adminRemark") String adminRemark);
}
