-- ============================================================
-- 在已有库 campus_textbook_recycle 上增量添加：评论表、举报表
-- 说明：
--   1) 自引用外键（parent_id → textbook_comment）在部分环境下不能写在同一条 CREATE 里，故拆成 ALTER。
--   2) 列名 detail 使用反引号，避免个别版本/工具解析异常。
--   3) 若你已有 textbook_comment 且评论功能正常，可只执行「一、举报表」段落。
-- ============================================================
USE campus_textbook_recycle;

-- ========= 一、举报表（解决 Table 'textbook_report' doesn't exist）=========
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

-- ========= 二、评论表（表已存在则跳过创建；仅在没有 fk_tc_parent 时添加）=========
CREATE TABLE IF NOT EXISTS textbook_comment (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    textbook_id     BIGINT          NOT NULL COMMENT '教材ID',
    user_id         BIGINT          NOT NULL COMMENT '评论学生用户ID',
    parent_id       BIGINT          DEFAULT NULL COMMENT '父评论ID，NULL 表示一级评论',
    content         VARCHAR(2000)   NOT NULL COMMENT '评论内容',
    status          VARCHAR(20)     NOT NULL DEFAULT 'VISIBLE' COMMENT 'VISIBLE/HIDDEN',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_tc_textbook (textbook_id),
    KEY idx_tc_parent (parent_id),
    KEY idx_tc_user (user_id),
    KEY idx_tc_status (status),
    CONSTRAINT fk_tc_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教材评论表';

SET @fk_parent_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'textbook_comment'
      AND CONSTRAINT_NAME = 'fk_tc_parent'
);
SET @sql_add_fk = IF(
    @fk_parent_exists = 0,
    'ALTER TABLE textbook_comment ADD CONSTRAINT fk_tc_parent FOREIGN KEY (parent_id) REFERENCES textbook_comment (id) ON DELETE CASCADE',
    'SELECT ''skip: fk_tc_parent already exists'' AS migration_note'
);
PREPARE stmt_add_fk FROM @sql_add_fk;
EXECUTE stmt_add_fk;
DEALLOCATE PREPARE stmt_add_fk;
