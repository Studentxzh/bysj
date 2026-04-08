package com.ncu.textbook.service;

import com.ncu.textbook.dto.CreateSaleOrderRequest;
import com.ncu.textbook.dto.SaleOrderView;
import com.ncu.textbook.entity.Student;
import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.entity.TransactionRecord;
import com.ncu.textbook.mapper.StudentMapper;
import com.ncu.textbook.mapper.TextbookMapper;
import com.ncu.textbook.mapper.TransactionRecordMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private static final String SALE_ORDER_PAID_STATUS = "PAID";
    private static final String PAYMENT_DISPLAY = "已付款（演示环境，未接入真实支付）";

    private final TextbookMapper textbookMapper;
    private final TransactionRecordMapper transactionRecordMapper;
    private final StudentMapper studentMapper;

    public TransactionService(TextbookMapper textbookMapper,
                              TransactionRecordMapper transactionRecordMapper,
                              StudentMapper studentMapper) {
        this.textbookMapper = textbookMapper;
        this.transactionRecordMapper = transactionRecordMapper;
        this.studentMapper = studentMapper;
    }

    @Transactional
    public SaleOrderView createSaleOrder(CreateSaleOrderRequest req) {
        Textbook tb = textbookMapper.findById(req.getTextbookId());
        if (tb == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "教材不存在");
        }
        if (!"ON_SALE".equals(tb.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "该教材不在售或已被下单");
        }
        if (!"SALE".equals(tb.getTransferType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持购买「出售」类教材");
        }
        if (tb.getUserId().equals(req.getBuyerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "不能购买自己发布的教材");
        }
        if (tb.getPrice() == null || tb.getPrice().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该出售教材价格无效");
        }

        int updated = textbookMapper.markSoldIfOnSale(tb.getId());
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "该教材刚刚已被他人购买");
        }

        TransactionRecord rec = new TransactionRecord();
        rec.setTextbookId(tb.getId());
        rec.setSellerId(tb.getUserId());
        rec.setBuyerId(req.getBuyerId());
        rec.setType("SALE");
        rec.setStatus(SALE_ORDER_PAID_STATUS);
        String remark = req.getContactRemark();
        rec.setContactRemark(remark != null && !remark.isBlank() ? remark.trim() : null);
        transactionRecordMapper.insert(rec);

        return toView(rec, tb);
    }

    public List<SaleOrderView> listSaleOrdersForBuyer(Long buyerId) {
        return transactionRecordMapper.findSaleOrdersByBuyerId(buyerId).stream()
                .map(this::toViewWithTextbook)
                .collect(Collectors.toList());
    }

    public SaleOrderView getSaleOrderForBuyer(Long orderId, Long buyerId) {
        TransactionRecord rec = transactionRecordMapper.findById(orderId);
        if (rec == null || !"SALE".equals(rec.getType())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        if (!rec.getBuyerId().equals(buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权查看该订单");
        }
        Textbook tb = textbookMapper.findById(rec.getTextbookId());
        if (tb == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "关联教材已不存在");
        }
        return toView(rec, tb);
    }

    private SaleOrderView toViewWithTextbook(TransactionRecord rec) {
        Textbook tb = textbookMapper.findById(rec.getTextbookId());
        if (tb == null) {
            SaleOrderView v = new SaleOrderView();
            v.setOrderId(rec.getId());
            v.setStatus(rec.getStatus());
            v.setPaymentDisplay(PAYMENT_DISPLAY);
            v.setCreateTime(rec.getCreateTime());
            v.setTextbookId(rec.getTextbookId());
            v.setTextbookTitle("（教材已删除）");
            v.setSellerId(rec.getSellerId());
            return v;
        }
        return toView(rec, tb);
    }

    private SaleOrderView toView(TransactionRecord rec, Textbook tb) {
        SaleOrderView v = new SaleOrderView();
        v.setOrderId(rec.getId());
        v.setStatus(rec.getStatus());
        v.setPaymentDisplay(PAYMENT_DISPLAY);
        v.setCreateTime(rec.getCreateTime());
        v.setTextbookId(tb.getId());
        v.setTextbookTitle(tb.getTitle());
        v.setCoverImage(tb.getCoverImage());
        v.setPrice(tb.getPrice());
        v.setSellerId(tb.getUserId());
        Student seller = studentMapper.findById(tb.getUserId());
        v.setSellerRealName(seller != null ? seller.getRealName() : null);
        return v;
    }
}
