package com.ncu.textbook.controller;

import com.ncu.textbook.entity.Announcement;
import com.ncu.textbook.mapper.AnnouncementMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementMapper announcementMapper;

    public AnnouncementController(AnnouncementMapper announcementMapper) {
        this.announcementMapper = announcementMapper;
    }

    /** 首页等平台：仅返回已启用的公告 */
    @GetMapping
    public List<Announcement> listPublished() {
        return announcementMapper.findPublished();
    }
}
