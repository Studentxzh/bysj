package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.Textbook;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface TextbookMapper {

    @Select("""
            SELECT * FROM textbook
            WHERE (#{keyword} IS NULL
                   OR title LIKE CONCAT('%', #{keyword}, '%')
                   OR author LIKE CONCAT('%', #{keyword}, '%')
                   OR course_name LIKE CONCAT('%', #{keyword}, '%')
                   OR isbn LIKE CONCAT('%', #{keyword}, '%'))
            ORDER BY create_time DESC
            """)
    List<Textbook> search(@Param("keyword") String keyword);

    @Select("SELECT * FROM textbook ORDER BY create_time DESC")
    List<Textbook> findAll();

    @Select("SELECT * FROM textbook WHERE status = #{status} ORDER BY create_time DESC")
    List<Textbook> findByStatus(@Param("status") String status);

    @Select("SELECT * FROM textbook WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<Textbook> findByUserId(@Param("userId") Long userId);

    @Update("UPDATE textbook SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") String status);

    /** 仅当仍在架时标为已售出，用于出售下单并发安全 */
    @Update("UPDATE textbook SET status = 'SOLD' WHERE id = #{id} AND status = 'ON_SALE'")
    int markSoldIfOnSale(@Param("id") Long id);

    @Select("SELECT * FROM textbook WHERE id = #{id}")
    Textbook findById(@Param("id") Long id);

    @Delete("DELETE FROM textbook WHERE id = #{id} AND user_id = #{userId}")
    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Delete("DELETE FROM textbook WHERE id = #{id}")
    int deleteById(@Param("id") Long id);

    @Update("""
            UPDATE textbook
            SET title = #{title},
                author = #{author},
                publisher = #{publisher},
                publish_year = #{publishYear},
                course_name = #{courseName},
                condition_level = #{conditionLevel},
                transfer_type = #{transferType},
                price = #{price},
                description = #{description},
                cover_image = #{coverImage}
            WHERE id = #{id} AND user_id = #{userId}
            """)
    int updateByIdAndUserId(Textbook textbook);

    @Insert("""
            INSERT INTO textbook
            (user_id, title, isbn, author, publisher, publish_year,
             course_name, condition_level, transfer_type,
             price, description, cover_image,
             status, view_count, create_time, update_time)
            VALUES
            (#{userId}, #{title}, #{isbn}, #{author}, #{publisher}, #{publishYear},
             #{courseName}, #{conditionLevel}, #{transferType},
             #{price}, #{description}, #{coverImage},
             #{status}, #{viewCount}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Textbook textbook);
}

