package com.ncu.textbook.dto;

import jakarta.validation.constraints.NotNull;

public class CreateSaleOrderRequest {

    @NotNull
    private Long buyerId;

    @NotNull
    private Long textbookId;

    /** 可选联系备注 */
    private String contactRemark;

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getTextbookId() {
        return textbookId;
    }

    public void setTextbookId(Long textbookId) {
        this.textbookId = textbookId;
    }

    public String getContactRemark() {
        return contactRemark;
    }

    public void setContactRemark(String contactRemark) {
        this.contactRemark = contactRemark;
    }
}
