package com.ncu.textbook.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 出售类订单（演示：无真实支付，展示为已付款） */
public class SaleOrderView {

    private Long orderId;
    private String status;
    /** 前端展示用：已付款（模拟） */
    private String paymentDisplay;
    private LocalDateTime createTime;

    private Long textbookId;
    private String textbookTitle;
    private String coverImage;
    private BigDecimal price;

    private Long sellerId;
    private String sellerRealName;

    /** 后台订单列表等场景填充 */
    private Long buyerId;
    private String buyerRealName;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentDisplay() {
        return paymentDisplay;
    }

    public void setPaymentDisplay(String paymentDisplay) {
        this.paymentDisplay = paymentDisplay;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public Long getTextbookId() {
        return textbookId;
    }

    public void setTextbookId(Long textbookId) {
        this.textbookId = textbookId;
    }

    public String getTextbookTitle() {
        return textbookTitle;
    }

    public void setTextbookTitle(String textbookTitle) {
        this.textbookTitle = textbookTitle;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getSellerRealName() {
        return sellerRealName;
    }

    public void setSellerRealName(String sellerRealName) {
        this.sellerRealName = sellerRealName;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerRealName() {
        return buyerRealName;
    }

    public void setBuyerRealName(String buyerRealName) {
        this.buyerRealName = buyerRealName;
    }
}
