-- ============================================================
-- 基于SpringBoot的校园二手教材循环利用平台 - 数据库建表脚本
-- 数据库: MySQL 5.7+ / 8.0
-- 字符集: utf8mb4
-- ============================================================

-- 创建数据库（若已存在可跳过）
CREATE DATABASE IF NOT EXISTS campus_textbook_recycle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_textbook_recycle;

-- ============================================================
-- 1. 用户表 sys_user
-- 说明：学生用户注册与登录，支持学号登录、密码加密、手机脱敏
-- ============================================================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    username        VARCHAR(32)     NOT NULL COMMENT '登录名/学号',
    password        VARCHAR(128)    NOT NULL COMMENT '密码(加密存储)',
    real_name       VARCHAR(32)     NOT NULL COMMENT '姓名',
    phone           VARCHAR(20)     DEFAULT NULL COMMENT '手机号(可脱敏)',
    college         VARCHAR(64)     DEFAULT NULL COMMENT '学院',
    major           VARCHAR(64)     DEFAULT NULL COMMENT '专业',
    class_name      VARCHAR(64)     DEFAULT NULL COMMENT '班级',
    role            VARCHAR(16)     NOT NULL DEFAULT 'student' COMMENT '角色: student-学生, admin-管理员',
    status          TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_phone (phone),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. 教材表 textbook
-- 说明：二手教材信息，支持出售/免费赠送/只借不卖三种流转类型
-- ============================================================
DROP TABLE IF EXISTS textbook;
CREATE TABLE textbook (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id         BIGINT          NOT NULL COMMENT '发布者用户ID',
    title           VARCHAR(200)    NOT NULL COMMENT '书名',
    isbn            VARCHAR(32)     DEFAULT NULL COMMENT 'ISBN',
    author          VARCHAR(100)    DEFAULT NULL COMMENT '作者',
    publisher       VARCHAR(100)    DEFAULT NULL COMMENT '出版社',
    publish_year    VARCHAR(20)     DEFAULT NULL COMMENT '出版年份/版次',
    course_name     VARCHAR(100)    DEFAULT NULL COMMENT '适用课程',
    condition_level VARCHAR(20)     DEFAULT NULL COMMENT '新旧程度(如: 全新/九成新/一般等)',
    transfer_type   VARCHAR(16)     NOT NULL COMMENT '流转类型: SALE-出售, FREE-免费赠送, BORROW-只借不卖',
    price           DECIMAL(10,2)   DEFAULT NULL COMMENT '价格(元), 仅出售时必填',
    description     TEXT            DEFAULT NULL COMMENT '描述说明',
    cover_image     VARCHAR(255)    DEFAULT NULL COMMENT '书面/封面图片路径，用于列表与搜索时展示教材图片；存相对路径或URL，前端拼接域名或静态资源根路径展示',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ON_SALE' COMMENT '状态: ON_SALE-在架, OFF_SALE-已下架, SOLD-已售出/已送出, BORROWED-已借出',
    view_count      INT             NOT NULL DEFAULT 0 COMMENT '浏览次数',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_transfer_type (transfer_type),
    KEY idx_status (status),
    KEY idx_title (title(50)),
    KEY idx_create_time (create_time),
    CONSTRAINT fk_textbook_user FOREIGN KEY (user_id) REFERENCES sys_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教材表';

-- ============================================================
-- 3. 消息通知表 message
-- 说明：站内消息/通知，如系统通知、交易相关提醒
-- ============================================================
DROP TABLE IF EXISTS message;
CREATE TABLE message (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id         BIGINT          NOT NULL COMMENT '接收用户ID',
    type            VARCHAR(32)     NOT NULL DEFAULT 'system' COMMENT '类型: system-系统, trade-交易, other-其他',
    title           VARCHAR(100)    NOT NULL COMMENT '标题',
    content         TEXT            DEFAULT NULL COMMENT '内容',
    is_read         TINYINT         NOT NULL DEFAULT 0 COMMENT '是否已读: 0-未读, 1-已读',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_is_read (is_read),
    KEY idx_create_time (create_time),
    CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES sys_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息通知表';

-- ============================================================
-- 4. 交易/意向记录表 transaction_record
-- 说明：教材的购买、领取、借阅等意向或成交记录
-- ============================================================
DROP TABLE IF EXISTS transaction_record;
CREATE TABLE transaction_record (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    textbook_id     BIGINT          NOT NULL COMMENT '教材ID',
    seller_id       BIGINT          NOT NULL COMMENT '发布者/卖方用户ID',
    buyer_id        BIGINT          NOT NULL COMMENT '买方/领取方/借阅方用户ID',
    type            VARCHAR(16)     NOT NULL COMMENT '类型: SALE-购买, FREE-领取赠送, BORROW-借阅',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING-待确认, CONFIRMED-已确认, COMPLETED-已完成, CANCELLED-已取消, PAID-已付款(演示出售订单)',
    contact_remark  VARCHAR(200)    DEFAULT NULL COMMENT '联系备注(可选)',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_textbook_id (textbook_id),
    KEY idx_seller_id (seller_id),
    KEY idx_buyer_id (buyer_id),
    KEY idx_status (status),
    KEY idx_create_time (create_time),
    CONSTRAINT fk_tr_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE,
    CONSTRAINT fk_tr_seller FOREIGN KEY (seller_id) REFERENCES sys_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_tr_buyer FOREIGN KEY (buyer_id) REFERENCES sys_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易/意向记录表';

-- ============================================================
-- 可选：教材分类表（若需按分类检索可启用）
-- ============================================================
-- DROP TABLE IF EXISTS category;
-- CREATE TABLE category (
--     id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
--     name            VARCHAR(50)     NOT NULL COMMENT '分类名称',
--     parent_id       BIGINT          NOT NULL DEFAULT 0 COMMENT '父分类ID, 0为顶级',
--     sort_order      INT             NOT NULL DEFAULT 0 COMMENT '排序',
--     create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     PRIMARY KEY (id),
--     KEY idx_parent_id (parent_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教材分类表';

-- ============================================================
-- 初始化说明
-- ============================================================
-- 1. 首次执行前请确认 MySQL 版本与字符集。
-- 2. 若不需要自动创建数据库，可注释掉 CREATE DATABASE 与 USE，并在执行前手动 USE your_db;
-- 3. 用户密码请在应用层使用 BCrypt 等算法加密后再写入 password 字段。
-- 4. 教材表按书名关键词搜索可使用: WHERE title LIKE CONCAT('%', ?, '%')，或配合全文索引(MySQL 5.7+)。
-- 5. 搜索/列表接口查询教材时请 SELECT 包含 cover_image 字段，前端即可展示书面图片；无图时 cover_image 为 NULL，前端可显示默认占位图。
