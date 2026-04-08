package com.ncu.textbook.controller;

import com.ncu.textbook.dto.SaleOrderView;
import com.ncu.textbook.service.TransactionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sale-orders")
public class AdminOrderController {

    private final TransactionService transactionService;

    public AdminOrderController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<SaleOrderView> listSaleOrders() {
        return transactionService.listAllSaleOrdersForAdmin();
    }
}
