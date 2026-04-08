package com.ncu.textbook.mapper;

import com.ncu.textbook.entity.TransactionRecord;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TransactionRecordMapper {

    @Select("SELECT * FROM transaction_record WHERE id = #{id}")
    TransactionRecord findById(@Param("id") Long id);

    @Select("""
            SELECT * FROM transaction_record
            WHERE buyer_id = #{buyerId} AND type = 'SALE'
            ORDER BY create_time DESC
            """)
    List<TransactionRecord> findSaleOrdersByBuyerId(@Param("buyerId") Long buyerId);

    @Select("""
            SELECT * FROM transaction_record
            WHERE type = 'SALE'
            ORDER BY create_time DESC
            """)
    List<TransactionRecord> findAllSaleOrders();

    @Insert("""
            INSERT INTO transaction_record
            (textbook_id, seller_id, buyer_id, type, status, contact_remark, create_time, update_time)
            VALUES
            (#{textbookId}, #{sellerId}, #{buyerId}, #{type}, #{status}, #{contactRemark}, NOW(), NOW())
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TransactionRecord record);
}
