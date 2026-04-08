package com.ncu.textbook.controller;

import com.ncu.textbook.dto.PublishTextbookRequest;
import com.ncu.textbook.entity.Textbook;
import com.ncu.textbook.mapper.TextbookMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/textbooks")
public class TextbookController {

    private final TextbookMapper textbookMapper;

    public TextbookController(TextbookMapper textbookMapper) {
        this.textbookMapper = textbookMapper;
    }

    @GetMapping
    public List<Textbook> search(@RequestParam(required = false) String keyword) {
        if (keyword == null || keyword.isBlank()) {
            // 普通用户列表只展示在架教材
            return textbookMapper.findByStatus("ON_SALE");
        }
        return textbookMapper.search(keyword.trim());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Textbook> detail(@PathVariable Long id) {
        Textbook tb = textbookMapper.findById(id);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tb);
    }

    @PostMapping
    public ResponseEntity<Void> publish(@Valid @RequestBody PublishTextbookRequest req) {
        Textbook tb = new Textbook();
        tb.setUserId(req.getUserId());
        tb.setTitle(req.getTitle());
        tb.setIsbn(req.getIsbn());
        tb.setAuthor(req.getAuthor());
        tb.setPublisher(req.getPublisher());
        tb.setPublishYear(req.getPublishYear());
        tb.setCourseName(req.getCourseName());
        tb.setConditionLevel(req.getConditionLevel());
        tb.setTransferType(req.getTransferType());
        // 校验流转模式与价格/描述
        String type = req.getTransferType();
        if ("SALE".equals(type)) {
            if (req.getPrice() == null || req.getPrice().doubleValue() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            tb.setPrice(req.getPrice());
        } else if ("FREE".equals(type)) {
            tb.setPrice(java.math.BigDecimal.ZERO);
        } else if ("BORROW".equals(type)) {
            if (req.getDescription() == null || req.getDescription().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            tb.setPrice(null);
        }
        tb.setDescription(req.getDescription());
        tb.setCoverImage(req.getCoverImage());
        tb.setStatus("ON_SALE");
        tb.setViewCount(0);
        textbookMapper.insert(tb);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam("userId") Long userId) {
        Textbook tb = textbookMapper.findById(id);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        if (!tb.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        int rows = textbookMapper.deleteByIdAndUserId(id, userId);
        if (rows > 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody PublishTextbookRequest req) {
        Textbook tb = textbookMapper.findById(id);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.getUserId() == null || !tb.getUserId().equals(req.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        tb.setTitle(req.getTitle());
        tb.setAuthor(req.getAuthor());
        tb.setPublisher(req.getPublisher());
        tb.setPublishYear(req.getPublishYear());
        tb.setCourseName(req.getCourseName());
        tb.setConditionLevel(req.getConditionLevel());
        tb.setTransferType(req.getTransferType());
        String type = req.getTransferType();
        if ("SALE".equals(type)) {
            if (req.getPrice() == null || req.getPrice().doubleValue() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            tb.setPrice(req.getPrice());
        } else if ("FREE".equals(type)) {
            tb.setPrice(java.math.BigDecimal.ZERO);
        } else if ("BORROW".equals(type)) {
            if (req.getDescription() == null || req.getDescription().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            tb.setPrice(null);
        }
        tb.setDescription(req.getDescription());
        tb.setCoverImage(req.getCoverImage());
        int rows = textbookMapper.updateByIdAndUserId(tb);
        if (rows > 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long id,
                                             @RequestParam("userId") Long userId,
                                             @RequestParam("status") String status) {
        Textbook tb = textbookMapper.findById(id);
        if (tb == null) {
            return ResponseEntity.notFound().build();
        }
        if (!tb.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // 允许的状态：ON_SALE / SOLD / BORROWED / OFF_SALE
        if (!"ON_SALE".equals(status) && !"SOLD".equals(status)
                && !"BORROWED".equals(status) && !"OFF_SALE".equals(status)) {
            return ResponseEntity.badRequest().build();
        }
        textbookMapper.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }
}

