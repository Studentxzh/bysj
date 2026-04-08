-- 仅创建举报表（已有评论表、只缺 textbook_report 时执行本文件即可）
USE campus_textbook_recycle;

DROP TABLE IF EXISTS textbook_report;
CREATE TABLE textbook_report (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    textbook_id     BIGINT          NOT NULL COMMENT '被举报教材ID',
    reporter_id     BIGINT          NOT NULL COMMENT '举报人（学生）ID',
    reason          VARCHAR(64)     NOT NULL COMMENT '举报类型',
    `detail`        VARCHAR(1000)   DEFAULT NULL COMMENT '补充说明',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/PROCESSED/REJECTED',
    admin_remark    VARCHAR(500)    DEFAULT NULL COMMENT '管理员备注',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_tr_textbook (textbook_id),
    KEY idx_tr_reporter (reporter_id),
    KEY idx_tr_status (status),
    CONSTRAINT fk_tbr_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE,
    CONSTRAINT fk_tbr_reporter FOREIGN KEY (reporter_id) REFERENCES sys_student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教材举报表';
