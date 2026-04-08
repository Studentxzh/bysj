-- 已有库增量：平台公告表（执行一次即可）
USE campus_textbook_recycle;

CREATE TABLE IF NOT EXISTS sys_announcement (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    title           VARCHAR(200)    NOT NULL COMMENT '标题',
    content         TEXT            DEFAULT NULL COMMENT '正文',
    enabled         TINYINT         NOT NULL DEFAULT 1 COMMENT '是否展示: 0-否, 1-是',
    sort_order      INT             NOT NULL DEFAULT 0 COMMENT '排序，数值越小越靠前',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_enabled_sort (enabled, sort_order),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台公告表';
