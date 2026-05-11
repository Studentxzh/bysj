# 校园二手教材循环利用平台（Campus Textbook Recycle Platform）

## 📖 项目简介

**校园二手教材循环利用平台**是一个基于 Spring Boot 的全栈 Web 应用，为高校学生提供二手教材的流通、交易和共享服务。平台支持教材出售、免费赠送、借阅等多种交易模式，致力于实现教学资源的高效循环利用。

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
│   ├── src/main/resources/
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