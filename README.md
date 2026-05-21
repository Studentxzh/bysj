# 校园二手教材循环利用平台（Campus Textbook Recycle Platform）

## 📖 项目简介

**校园二手教材循环利用平台**是一个基于 Spring Boot 的全栈 Web 应用，为高校学生提供二手教材的流通、交易和共享服务。平台支持教材出售、免费赠送、只借不卖三种流转类型，同时提供完善的评论、举报、消息通知等功能。

## ✨ 核心功能

### 学生端功能
- **教材浏览与搜索**：按书名、课程等关键词快速查找教材
- **教材发布**：支持出售（SALE）、免费赠送（FREE）、只借不卖（BORROW）三种流转类型
- **教材详情**：查看完整的书籍信息、封面图片、发布者信息
- **交易管理**：
  - 发起购买、领取、借阅请求
  - 查看和管理自己的订单
  - 支持交易状态跟踪（待确认、已确认、已完成等）
- **互动功能**：
  - 对教材进行评论和回复
  - 举报违规教材或信息
- **个人中心**：
  - 管理已发布的教材
  - 查看交易历史
  - 修改个人信息
- **消息通知**：接收交易相关提醒和系统通知

### 管理员端功能
- **公告管理**：发布平台公告，设置排序和显示状态
- **举报处理**：审核学生举报的违规教材，标记为已处理或驳回
- **用户管理**：查看、启用/禁用学生账户
- **平台监控**：监管平台内容和秩序

## 🏗️ 技术架构

### 后端技术栈
- **框架**：Spring Boot 3.3.11
- **语言**：Java 17
- **数据访问**：MyBatis + MySQL 8.0
- **验证**：Spring Validation
- **构建工具**：Maven

### 前端技术栈
- **标记语言**：HTML5
- **样式**：CSS3
- **交互**：原生 JavaScript (ES6+)
- **无依赖**：不依赖前端框架，轻量级设计

### 语言构成
- **Java**：46.8%（后端核心业务逻辑）
- **JavaScript**：32.3%（前端交互）
- **HTML**：13.8%（页面结构）
- **CSS**：7.1%（样式布局）

### 数据库设计
主要表结构包括：
- `sys_student`：学生用户表
- `sys_admin`：管理员表
- `textbook`：教材表（支持多字段索引）
- `textbook_comment`：教材评论表（支持回复）
- `textbook_report`：教材举报表
- `transaction_record`：交易/意向记录表
- `message`：消息通知表
- `sys_announcement`：平台公告表

## 📁 项目结构

```
bysj/
├── server/                          # 后端 Spring Boot 项目
│   ├── src/main/java/com/ncu/textbook/
│   │   ├── controller/              # 控制器层
│   │   ├── service/                 # 业务逻辑层
│   │   ├── mapper/                  # 数据访问层 (MyBatis)
│   │   ├── entity/                  # 数据模型
│   │   ├── dto/                     # 数据传输对象
│   │   ├── common/                  # 通用工具与常量
│   │   └── TextbookApplication.java # 启动类
│   ���── src/main/resources/
│   │   ├── application.properties   # 应用配置
│   │   ├── application.yml          # Spring Boot 配置
│   │   └── mapper/                  # MyBatis 映射文件
│   └── pom.xml                      # Maven 依赖配置
├── web/                             # 前端静态文件
│   ├── index.html                   # 首页（教材列表）
│   ├── detail.html                  # 教材详情页
│   ├── publish.html                 # 教材发布页
│   ├── order.html                   # 订单/交易列表页
│   ├── profile.html                 # 个人中心页
│   ├── admin.html                   # 管理员后台
│   ├── login.html                   # 登录页
│   └── assets/
│       ├── app.js                   # 主应用 JavaScript
│       ├── styles.css               # 全局样式
│       └── ...                      # 其他资源文件
├── sql/                             # 数据库脚本
│   ├── init_schema.sql              # 初始化数据库表结构
│   ├── migrate_from_sys_user_to_split.sql
│   ├── migration_add_announcement.sql
│   ├── migration_comments_reports.sql
│   └── ...                          # 其他迁移脚本
├── uploads/                         # 文件上传存储目录
└── README.md                        # 本文件
```

## 📊 数据库实体详细设计

### 1. sys_student（学生用户表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 学生编号，自增主键 |
| username | VARCHAR(32) | UNIQUE NOT NULL | 登录名/学号，唯一约束 |
| password | VARCHAR(128) | NOT NULL | 密码(BCrypt加密存储) |
| real_name | VARCHAR(32) | NOT NULL | 真实姓名 |
| phone | VARCHAR(20) | NULL | 手机号码(可脱敏) |
| college | VARCHAR(64) | NULL | 学院 |
| major | VARCHAR(64) | NULL | 专业 |
| class_name | VARCHAR(64) | NULL | 班级 |
| status | TINYINT | NOT NULL | 账户状态：0-禁用, 1-正常 |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `UNIQUE KEY uk_student_username (username)` - 确保学号唯一
- `KEY idx_student_phone (phone)` - 优化按电话查询
- `KEY idx_student_status (status)` - 优化按状态过滤

**级联关系：**
- 一个学生可发布多个教材 (1:N with textbook)
- 一个学生接收多条消息 (1:N with message)
- 一个学生发表多条评论 (1:N with textbook_comment)
- 一个学生举报多个教材 (1:N with textbook_report)
- 一个学生作为买方和卖方参与多笔交易 (1:N with transaction_record)

---

### 2. sys_admin（管理员表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 管理员编号，自增(起始10000000) |
| username | VARCHAR(32) | UNIQUE NOT NULL | 登录账号，唯一约束 |
| password | VARCHAR(128) | NOT NULL | 密码(BCrypt加密存储) |
| real_name | VARCHAR(32) | NOT NULL | 真实姓名 |
| status | TINYINT | NOT NULL | 状态：0-禁用, 1-正常 |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `UNIQUE KEY uk_admin_username (username)` - 确保账号唯一
- `KEY idx_admin_status (status)` - 优化按状态过滤

**特点：**
- 管理员ID从10000000开始，与学生ID(小于10000000)自然隔离
- 权限独立，不涉及教材、评论、交易等业务操作
- 专注于系统管理：公告维护、举报处理、用户账户管理

**级联关系：**
- 一个管理员维护多条公告 (1:N with sys_announcement)

---

### 3. textbook（教材表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 教材编号，自增主键 |
| user_id | BIGINT | FK NOT NULL | 发布者用户ID，关联sys_student |
| title | VARCHAR(200) | NOT NULL | 书名 |
| isbn | VARCHAR(32) | NULL | ISBN编号 |
| author | VARCHAR(100) | NULL | 作者 |
| publisher | VARCHAR(100) | NULL | 出版社 |
| publish_year | VARCHAR(20) | NULL | 出版年份/版次 |
| course_name | VARCHAR(100) | NULL | 适用课程 |
| condition_level | VARCHAR(20) | NULL | 新旧程度(如:全新/九成新/一般等) |
| transfer_type | VARCHAR(16) | NOT NULL | 流转类型：SALE-出售, FREE-免费赠送, BORROW-只借不卖 |
| price | DECIMAL(10,2) | NULL | 价格(元)，仅出售时必填 |
| description | TEXT | NULL | 描述说明 |
| cover_image | VARCHAR(255) | NULL | 书面/封面图片路径，用于列表与搜索展示；存相对路径或URL |
| status | VARCHAR(20) | NOT NULL | 状态：ON_SALE-在架, OFF_SALE-已下架, SOLD-已售出/已送出, BORROWED-已借出 |
| view_count | INT | NOT NULL | 浏览次数(默认0) |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `FK idx_user_id (user_id)` - 外键索引，查询用户发布的教材
- `KEY idx_transfer_type (transfer_type)` - 优化按流转类型过滤
- `KEY idx_status (status)` - 优化按状态过滤
- `KEY idx_title (title(50))` - 前缀索引，优化按书名搜索
- `KEY idx_create_time (create_time)` - 优化按发布时间排序

**外键约束：**
- `CONSTRAINT fk_textbook_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除学生时，自动删除其发布的所有教材

**流转类型值域：**
- `SALE` - 出售教材(付费)
- `FREE` - 免费赠送教材
- `BORROW` - 只借不卖教材(借期制)

**状态值域：**
- `ON_SALE` - 在架/可交易状态
- `OFF_SALE` - 已下架(发布者主动下架)
- `SOLD` - 已售出或已赠送(出售/免费流转完成)
- `BORROWED` - 已借出(借阅中)

**级联关系：**
- 一个教材有多条交易记录 (1:N with transaction_record)
- 一个教材有多条评论 (1:N with textbook_comment)
- 一个教材有多条举报记录 (1:N with textbook_report)

---

### 4. transaction_record（交易/意向记录表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 交易编号，自增主键 |
| textbook_id | BIGINT | FK NOT NULL | 教材ID，关联textbook |
| seller_id | BIGINT | FK NOT NULL | 发布者/卖方用户ID，关联sys_student |
| buyer_id | BIGINT | FK NOT NULL | 买方/领取方/借阅方用户ID，关联sys_student |
| type | VARCHAR(16) | NOT NULL | 交易类型：SALE-购买, FREE-领取赠送, BORROW-借阅 |
| status | VARCHAR(20) | NOT NULL | 交易状态：PENDING-待确认, CONFIRMED-已确认, COMPLETED-已完成, CANCELLED-已取消, PAID-已付款 |
| contact_remark | VARCHAR(200) | NULL | 联系备注(可选)，买卖双方的沟通备注信息 |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `FK idx_textbook_id (textbook_id)` - 外键索引，查询教材的所有交易
- `FK idx_seller_id (seller_id)` - 外键索引，查询某学生的出售交易
- `FK idx_buyer_id (buyer_id)` - 外键索引，查询某学生的购买交易
- `KEY idx_status (status)` - 优化按交易状态过滤
- `KEY idx_create_time (create_time)` - 优化按创建时间排序

**外键约束：**
- `CONSTRAINT fk_tr_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE`
  - 删除教材时，级联删除相关交易记录
- `CONSTRAINT fk_tr_seller_student FOREIGN KEY (seller_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除卖方学生时，级联删除其作为卖方的交易
- `CONSTRAINT fk_tr_buyer_student FOREIGN KEY (buyer_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除买方学生时，级联删除其作为买方的交易

**交易类型值域：**
- `SALE` - 购买交易(付费购买)
- `FREE` - 免费领取交易
- `BORROW` - 借阅交易

**交易状态值域：**
- `PENDING` - 待确认(买方已发起，卖方未处理)
- `CONFIRMED` - 已确认(卖方已确认，双方可进行线下交付)
- `COMPLETED` - 已完成(交易完成，教材和付款已交割)
- `CANCELLED` - 已取消(买卖双方之一取消交易)
- `PAID` - 已付款(演示用途：出售订单直接标记已付款，跳过支付环节)

---

### 5. textbook_comment（教材评论表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 评论编号，自增主键 |
| textbook_id | BIGINT | FK NOT NULL | 教材ID，关联textbook |
| user_id | BIGINT | FK NOT NULL | 评论学生用户ID，关联sys_student |
| parent_id | BIGINT | FK NULL | 父评论ID，自关联；NULL表示一级评论；仅允许回复一级评论 |
| content | VARCHAR(2000) | NOT NULL | 评论内容 |
| status | VARCHAR(20) | NOT NULL | 状态：VISIBLE-展示, HIDDEN-管理员隐藏 |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |

**索引设计：**
- `FK idx_tc_textbook (textbook_id)` - 外键索引，查询教材的所有评论
- `FK idx_tc_parent (parent_id)` - 外键索引，查询评论的所有回复
- `FK idx_tc_user (user_id)` - 外键索引，查询某学生发表的评论
- `KEY idx_tc_status (status)` - 优化按状态过滤(只显示VISIBLE)

**外键约束：**
- `CONSTRAINT fk_tc_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE`
  - 删除教材时，级联删除所有评论
- `CONSTRAINT fk_tc_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除学生时，级联删除其发表的所有评论
- `CONSTRAINT fk_tc_parent FOREIGN KEY (parent_id) REFERENCES textbook_comment (id) ON DELETE CASCADE`
  - 删除一级评论时，级联删除所有回复

**自关联说明：**
- 支持评论回复功能：parent_id 指向一级评论的 id
- parent_id = NULL：一级评论(直接评论教材)
- parent_id ≠ NULL：二级评论(回复他人)
- **仅支持两层评论结构**，不支持无限嵌套回复

**状态值域：**
- `VISIBLE` - 评论正常展示
- `HIDDEN` - 管理员隐藏(内容不违规但不适合显示)

---

### 6. textbook_report（教材举报表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 举报编号，自增主键 |
| textbook_id | BIGINT | FK NOT NULL | 被举报教材ID，关联textbook |
| reporter_id | BIGINT | FK NOT NULL | 举报人(学生)ID，关联sys_student |
| reason | VARCHAR(64) | NOT NULL | 举报类型：FAKE_INFO-虚假信息, SPAM-垃圾信息, INAPPROPRIATE-不当内容, OTHER-其他 |
| detail | VARCHAR(1000) | NULL | 补充说明(举报原因的详细描述) |
| status | VARCHAR(20) | NOT NULL | 状态：PENDING-待处理, PROCESSED-已处理, REJECTED-驳回 |
| admin_remark | VARCHAR(500) | NULL | 管理员备注(处理结果说明或驳回理由) |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `FK idx_tr_textbook (textbook_id)` - 外键索引，查询教材的所有举报
- `FK idx_tr_reporter (reporter_id)` - 外键索引，查询某学生的举报记录
- `KEY idx_tr_status (status)` - 优化按处理状态过滤

**外键约束：**
- `CONSTRAINT fk_tbr_textbook FOREIGN KEY (textbook_id) REFERENCES textbook (id) ON DELETE CASCADE`
  - 删除教材时，级联删除相关举报记录
- `CONSTRAINT fk_tbr_reporter FOREIGN KEY (reporter_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除举报人时，级联删除其举报记录

**举报类型值域：**
- `FAKE_INFO` - 虚假信息(教材信息不符)
- `SPAM` - 垃圾信息(广告或无关内容)
- `INAPPROPRIATE` - 不当内容(违反平台规则)
- `OTHER` - 其他理由

**举报状态值域：**
- `PENDING` - 待处理(管理员未审核)
- `PROCESSED` - 已处理(管理员处理完成，可能下架教材)
- `REJECTED` - 驳回(管理员审核后认为举报无效)

---

### 7. message（消息通知表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 消息编号，自增主键 |
| user_id | BIGINT | FK NOT NULL | 接收用户ID，关联sys_student |
| type | VARCHAR(32) | NOT NULL | 消息类型：system-系统, trade-交易, other-其他 |
| title | VARCHAR(100) | NOT NULL | 消息标题 |
| content | TEXT | NULL | 消息内容(详细描述) |
| is_read | TINYINT | NOT NULL | 已读标志：0-未读, 1-已读 |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |

**索引设计：**
- `FK idx_user_id (user_id)` - 外键索引，查询某学生的所有消息
- `KEY idx_is_read (is_read)` - 优化按已读状态过滤(查询未读消息)
- `KEY idx_create_time (create_time)` - 优化按创建时间排序

**外键约束：**
- `CONSTRAINT fk_message_student FOREIGN KEY (user_id) REFERENCES sys_student (id) ON DELETE CASCADE`
  - 删除学生时，级联删除其接收的所有消息

**消息类型值域：**
- `system` - 系统通知(平台维护、功能更新等)
- `trade` - 交易提醒(交易被确认、被完成、被取消等)
- `other` - 其他消息(反馈回复等)

**使用场景：**
- 教材被购买时，向卖方发送"新的购买请求"提醒
- 交易被确认时，向买方发送"交易已确认"通知
- 系统维护时，向用户发送系统通知

---

### 8. sys_announcement（平台公告表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 公告编号，自增主键 |
| title | VARCHAR(200) | NOT NULL | 公告标题 |
| content | TEXT | NULL | 公告正文(详细内容) |
| enabled | TINYINT | NOT NULL | 是否展示：0-否(隐藏), 1-是(显示) |
| sort_order | INT | NOT NULL | 排序权重，数值越小越靠前(升序排列) |
| create_time | DATETIME | NOT NULL | 创建时间(默认当前时间) |
| update_time | DATETIME | NOT NULL | 更新时间(自动更新) |

**索引设计：**
- `KEY idx_enabled_sort (enabled, sort_order)` - 复合索引，优化查询已启用公告时的排序效率
  - 用于查询：`WHERE enabled = 1 ORDER BY sort_order ASC`
- `KEY idx_create_time (create_time)` - 优化按创建时间排序

**特点：**
- 不与用户或管理员关联，是独立的系统配置表
- 管理员通过后台维护公告内容
- 前端首页轮播展示已启用的公告

**显示规则：**
- 前端查询时只显示 `enabled = 1` 的公告
- 按 `sort_order` 升序排列
- sort_order 相同时按 create_time 降序排列(最新的靠前)

**使用场景：**
- 平台公告(更新日志、功能说明)
- 系统维护通知(停机维护时间)
- 活动推广(参与有奖活动)
- 安全提示(账号安全提醒)

---

## 🚀 快速开始

### 环境要求
- Java 17+
- MySQL 5.7 / 8.0
- Maven 3.6+
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/Studentxzh/bysj.git
cd bysj
```

#### 2. 初始化数据库
```bash
# 使用 MySQL 客户端
mysql -u your_username -p < sql/init_schema.sql
```

或者在 MySQL 中执行：
```sql
-- 首先运行初始化脚本
source sql/init_schema.sql;
```

#### 3. 配置后端应用

编辑 `server/src/main/resources/application.properties` 或 `application.yml`：

```properties
# MySQL 数据库连接
spring.datasource.url=jdbc:mysql://localhost:3306/campus_textbook_recycle?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# MyBatis 配置
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=com.ncu.textbook.entity

# 服务器端口
server.port=8080

# 文件上传路径（可选）
file.upload-dir=./uploads
```

#### 4. 编译并运行后端
```bash
cd server
mvn clean package
mvn spring-boot:run
```

后端服务将运行在 `http://localhost:8080`

#### 5. 部署前端

将 `web/` 目录下的静态文件部署到 Web 服务器，或配置后端服务静态资源路径：

```properties
spring.web.resources.static-locations=classpath:/static/,file:./web/
```

访问 `http://localhost:8080` 打开应用。

## 📝 使用说明

### 学生账户
- **登录**：使用学号（username）和密码
- **初始密码**：请联系管理员或在注册时设置
- **发布教材**：填写书籍信息、选择交易类型、上传封面、发布
- **交易流程**：浏览 → 选择 → 发起交易 → 确认 → 完成

### 管理员账户
- **管理员 ID**：从 10000000 开始自增，避免与学生 ID 混淆
- **访问后台**：`http://localhost:8080/admin.html`
- **主要职责**：
  - 维护公告内容
  - 处理教材举报
  - 管理用户账户

## 🔐 安全考虑

- 密码存储：使用 BCrypt 等算法加密存储
- 用户隔离：学生和管理员分表存储，权限清晰
- 数据一致性：使用外键约束保证数据完整性
- 级联删除：删除用户时自动删除关联的教材、订单等数据

## 📊 数据库字符编码

- 字符集：UTF-8MB4（支持 emoji 和其他特殊字符）
- 排序规则：utf8mb4_unicode_ci
- 保证全平台数据兼容性

## 🛠️ 开发指南

### 后端开发
- Controller 层处理 HTTP 请求，调用 Service 业务逻辑
- Service 层实现复杂业务逻辑，调用 Mapper 数据访问
- Mapper 层使用 MyBatis 进行数据库操作，XML 映射文件位于 `resources/mapper/`
- Entity 与 DTO 分离，Entity 对应数据库表，DTO 用于 API 交互

### 前端开发
- 使用原生 JavaScript，无框架依赖，易于维护和扩展
- 样式集中管理在 `assets/styles.css`
- 主要逻辑在 `assets/app.js` 中，通过 AJAX 与后端交互
- 支持实时搜索、分页加载、评论回复等交互

### API 接口规范
- 统一使用 REST 风格设计
- 请求和响应均使用 JSON 格式
- 标准 HTTP 状态码：200 成功、400 请求错误、401 未授权、404 资源不存在、500 服务器错误
- 统一返回结构（示例）：
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {...}
  }
  ```

## 📋 常见问题

**Q：如何重置学生密码？**  
A：管理员可通过数据库直接更新 `sys_student` 表的 password 字段，确保使用 BCrypt 加密。

**Q：如何备份数据库？**  
A：使用 `mysqldump` 命令：
```bash
mysqldump -u root -p campus_textbook_recycle > backup.sql
```

**Q：教材图片存储在哪里？**  
A：`cover_image` 字段存储相对路径或 URL，前端拼接域名后显示。文件实际存放在 `uploads/` 目录。

**Q：支持哪些查询操作？**  
A：支持按书名、课程、交易类型、发布时间等条件查询和排序，具体见教材列表 API 文档。

## 📄 许可证

本项目为开源项目，仅供学习和参考使用。

## 👤 作者

Studentxzh

---

**最后更新**：2026年5月  
**项目状态**：积极维护中
