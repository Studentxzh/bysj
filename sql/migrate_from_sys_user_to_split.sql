-- ============================================================
-- 从旧版单表 sys_user 迁移到 sys_student + sys_admin（保留数据）
-- 执行前请备份数据库。适用于已存在 sys_user 且含 role 字段的旧库。
--
-- 【误跑 init_schema 之后】正确顺序：
--   1）用 Navicat 把「误操作前」的完整备份还原到本库（恢复后应有 sys_user 且业务表有数据）
--   2）若还原后仍残留空的 sys_student / sys_admin（极少见），且 sys_user 里仍有数据，可先执行：
--        DROP TABLE IF EXISTS sys_student;
--        DROP TABLE IF EXISTS sys_admin;
--   3）执行本脚本；外键名若与下面不一致，先运行 find_foreign_key_names.sql 对照修改第 4 步
-- ============================================================

-- 1) 新建两表（若已存在请先手动处理）
CREATE TABLE IF NOT EXISTS sys_student (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(32)     NOT NULL,
    password        VARCHAR(128)    NOT NULL,
    real_name       VARCHAR(32)     NOT NULL DEFAULT '',
    phone           VARCHAR(20)     DEFAULT NULL,
    college         VARCHAR(64)     DEFAULT NULL,
    major           VARCHAR(64)     DEFAULT NULL,
    class_name      VARCHAR(64)     DEFAULT NULL,
    status          TINYINT         NOT NULL DEFAULT 1,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_username (username),
    KEY idx_student_phone (phone),
    KEY idx_student_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生用户表';

CREATE TABLE IF NOT EXISTS sys_admin (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(32)     NOT NULL,
    password        VARCHAR(128)    NOT NULL,
    real_name       VARCHAR(32)     NOT NULL DEFAULT '',
    status          TINYINT         NOT NULL DEFAULT 1,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_username (username),
    KEY idx_admin_status (status)
) ENGINE=InnoDB AUTO_INCREMENT = 10000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 2) 导入学生（保持原 id，便于 textbook/message/transaction 外键仍有效）
INSERT INTO sys_student (id, username, password, real_name, phone, college, major, class_name, status, create_time, update_time)
SELECT id, username, password, real_name, phone, college, major, class_name, status, create_time, update_time
FROM sys_user WHERE role = 'student'
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- 2b) 学生数据带显式 id 插入后，修正 AUTO_INCREMENT，避免下次插入与学生 id 冲突
SET @next_stu := (SELECT IFNULL(MAX(id), 0) + 1 FROM sys_student);
SET @sql_stu := CONCAT('ALTER TABLE sys_student AUTO_INCREMENT = ', @next_stu);
PREPARE stmt_stu FROM @sql_stu;
EXECUTE stmt_stu;
DEALLOCATE PREPARE stmt_stu;

-- 3) 导入管理员（新 id 由自增分配，起始 10000000；旧管理员需重新登录后使用新 userId）
INSERT INTO sys_admin (username, password, real_name, status, create_time, update_time)
SELECT username, password, real_name, status, create_time, update_time
FROM sys_user WHERE role = 'admin';

-- 4) 删除旧外键并改为指向 sys_student（名称因库而异，请按 SHOW CREATE TABLE 调整）
ALTER TABLE textbook DROP FOREIGN KEY fk_textbook_user;
ALTER TABLE textbook ADD CONSTRAINT fk_textbook_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE;

ALTER TABLE message DROP FOREIGN KEY fk_message_user;
ALTER TABLE message ADD CONSTRAINT fk_message_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE;

ALTER TABLE transaction_record DROP FOREIGN KEY fk_tr_seller;
ALTER TABLE transaction_record DROP FOREIGN KEY fk_tr_buyer;
ALTER TABLE transaction_record ADD CONSTRAINT fk_tr_seller_student FOREIGN KEY (seller_id) REFERENCES sys_student (id) ON DELETE CASCADE;
ALTER TABLE transaction_record ADD CONSTRAINT fk_tr_buyer_student FOREIGN KEY (buyer_id) REFERENCES sys_student (id) ON DELETE CASCADE;

-- 5) 删除旧用户表
DROP TABLE IF EXISTS sys_user;
