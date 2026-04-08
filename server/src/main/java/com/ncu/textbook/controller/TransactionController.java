package com.ncu.textbook.controller;

import com.ncu.textbook.dto.CreateSaleOrderRequest;
import com.ncu.textbook.dto.SaleOrderView;
import com.ncu.textbook.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /** 创建出售类订单：演示场景下直接记为已付款，并将教材标为已售出 */
    @PostMapping("/sale-orders")
    public ResponseEntity<SaleOrderView> createSaleOrder(@Valid @RequestBody CreateSaleOrderRequest req) {
        SaleOrderView view = transactionService.createSaleOrder(req);
        return ResponseEntity.ok(view);
    }

    @GetMapping("/sale-orders")
    public List<SaleOrderView> listMySaleOrders(@RequestParam Long buyerId) {
        return transactionService.listSaleOrdersForBuyer(buyerId);
    }

    @GetMapping("/sale-orders/{id}")
    public SaleOrderView getSaleOrder(@PathVariable Long id, @RequestParam Long buyerId) {
        return transactionService.getSaleOrderForBuyer(id, buyerId);
    }
}
