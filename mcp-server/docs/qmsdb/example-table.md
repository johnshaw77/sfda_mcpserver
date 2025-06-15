# 表格: users (範例)

> 注意：這是一個範例文檔，用於展示資料庫表格結構文檔的格式。實際內容將在執行腳本後生成。

## 表格結構

| 欄位名稱   | 資料型別                       | 可為空 | 索引 | 預設值            | 備註             |
| ---------- | ------------------------------ | ------ | ---- | ----------------- | ---------------- |
| id         | int(11)                        | 否     | PRI  |                   | 使用者唯一識別碼 |
| username   | varchar(50)                    | 否     | UNI  |                   | 使用者登入名稱   |
| email      | varchar(100)                   | 否     | UNI  |                   | 使用者電子郵件   |
| password   | varchar(255)                   | 否     |      |                   | 加密後的密碼     |
| first_name | varchar(50)                    | 是     |      | NULL              | 使用者名         |
| last_name  | varchar(50)                    | 是     |      | NULL              | 使用者姓         |
| is_active  | tinyint(1)                     | 否     |      | 1                 | 帳號是否啟用     |
| role       | enum('admin','user','manager') | 否     |      | 'user'            | 使用者角色       |
| created_at | datetime                       | 否     |      | CURRENT_TIMESTAMP | 創建時間         |
| updated_at | datetime                       | 是     |      | NULL              | 最後更新時間     |

## 索引信息

| 索引名稱        | 欄位     | 唯一 | 類型  |
| --------------- | -------- | ---- | ----- |
| PRIMARY         | id       | 是   | BTREE |
| username_unique | username | 是   | BTREE |
| email_unique    | email    | 是   | BTREE |
| role_index      | role     | 否   | BTREE |

## 建立表格 SQL

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `role` enum('admin','user','manager') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_unique` (`username`),
  UNIQUE KEY `email_unique` (`email`),
  KEY `role_index` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
```
