# qsm 資料庫所有表格建立 SQL

資料庫名稱: **qsm**
主機: localhost:3306
產生時間: 2025/6/15 上午12:30:09

## 表格: org_employee

```sql
CREATE TABLE `org_employee` (
  `account_guid` varchar(50) DEFAULT NULL,
  `group_id` varchar(50) DEFAULT NULL,
  `group_name` varchar(50) DEFAULT NULL,
  `group_code` varchar(50) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `account_mapping` varchar(20) DEFAULT NULL,
  `password` varchar(25) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_invalid_attempts` tinyint NOT NULL,
  `pw_reset_reason` tinyint NOT NULL,
  `is_password_reset` bit(1) DEFAULT NULL,
  `is_locked_out` bit(1) DEFAULT NULL,
  `activity_date` datetime DEFAULT NULL,
  `expire_date` datetime DEFAULT NULL,
  `last_activity_date` datetime DEFAULT NULL,
  `last_locked_out_date` datetime DEFAULT NULL,
  `last_password_change_date` datetime DEFAULT NULL,
  `is_suspended` bit(1) DEFAULT NULL,
  `last_suspended_date` datetime DEFAULT NULL,
  `is_update_personal_info` bit(1) DEFAULT NULL,
  `last_update_personal_info_date` varchar(50) DEFAULT NULL,
  `user_type` varchar(50) DEFAULT NULL,
  `card_no` varchar(50) DEFAULT NULL,
  `employee_no` varchar(50) DEFAULT NULL,
  `domain` varchar(50) DEFAULT NULL,
  `account` varchar(50) DEFAULT NULL,
  `ca_serial_num` varchar(50) DEFAULT NULL,
  `is_usb_auth` bit(1) DEFAULT NULL,
  `usb_key` varchar(50) DEFAULT NULL,
  `lang` varchar(50) DEFAULT NULL,
  `email_a` varchar(50) DEFAULT NULL,
  `email_b` varchar(50) DEFAULT NULL,
  `email_c` varchar(50) DEFAULT NULL,
  `email_d` varchar(50) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  `arrive_date` datetime DEFAULT NULL,
  `leave_date` datetime DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `sex` varchar(5) DEFAULT NULL,
  `telphone` varchar(50) DEFAULT NULL,
  `ext_num` varchar(50) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `photo` varchar(50) DEFAULT NULL,
  `signature` varchar(50) DEFAULT NULL,
  `line` varchar(50) DEFAULT NULL,
  `skype` varchar(50) DEFAULT NULL,
  `wechat` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `title_name` varchar(100) DEFAULT NULL,
  `title_rank` tinyint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

## 表格: org_group

```sql
CREATE TABLE `org_group` (
  `group_id` varchar(50) DEFAULT NULL,
  `group_type` varchar(10) DEFAULT NULL,
  `group_name` varchar(50) DEFAULT NULL,
  `parent_group_id` varchar(50) DEFAULT NULL,
  `lft` tinyint DEFAULT NULL,
  `rgt` tinyint DEFAULT NULL,
  `lev` tinyint DEFAULT NULL,
  `group_code` varchar(50) DEFAULT NULL,
  `active` bit(1) DEFAULT NULL,
  `company_id` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

## 表格: qms_mrb_detail

```sql
CREATE TABLE `qms_mrb_detail` (
  `id` int NOT NULL,
  `開單廠區` varchar(10) DEFAULT NULL,
  `棟別` varchar(10) DEFAULT NULL,
  `EIP表單編號` varchar(20) DEFAULT NULL,
  `申請單類別` varchar(10) DEFAULT NULL,
  `申請判定項目` varchar(10) DEFAULT NULL,
  `報廢種類` varchar(10) DEFAULT NULL,
  `不良種類` varchar(20) DEFAULT NULL,
  `申請單位` varchar(20) DEFAULT NULL,
  `發現單位` varchar(40) DEFAULT NULL,
  `申請人` varchar(40) DEFAULT NULL,
  `申請日期` date DEFAULT NULL,
  `編碼周別` tinyint DEFAULT NULL,
  `異常發生日期` date DEFAULT NULL,
  `產品類型` varchar(10) DEFAULT NULL,
  `製程品類` varchar(10) DEFAULT NULL,
  `品目` varchar(10) DEFAULT NULL,
  `品目版本` varchar(20) DEFAULT NULL,
  `版本` varchar(10) DEFAULT NULL,
  `不良代碼` varchar(10) DEFAULT NULL,
  `不良大項` varchar(20) DEFAULT NULL,
  `不合格項目(細項)` varchar(80) DEFAULT NULL,
  `不良項目` longtext,
  `發生原因` longtext,
  `圖程` varchar(10) DEFAULT NULL,
  `圖程說明` varchar(30) DEFAULT NULL,
  `工單類別(0:正.1:再)` tinyint DEFAULT NULL,
  `不良制番` varchar(10) DEFAULT NULL,
  `PNL 生產數` smallint DEFAULT NULL,
  `PCS生產數` int DEFAULT NULL,
  `不良率` decimal(20,6) DEFAULT NULL,
  `責任佔比(率)` decimal(20,6) DEFAULT NULL,
  `責任單位` varchar(100) DEFAULT NULL,
  `異常LOT數` decimal(20,6) DEFAULT NULL,
  `PNL不良數` smallint DEFAULT NULL,
  `PCS不良數` int DEFAULT NULL,
  `造成損失金額(台幣)` int DEFAULT NULL,
  `5M1E` varchar(10) DEFAULT NULL,
  `PM設備編號` varchar(20) DEFAULT NULL,
  `PM設備名稱` varchar(50) DEFAULT NULL,
  `改善單位` varchar(40) DEFAULT NULL,
  `改善擔當` varchar(40) DEFAULT NULL,
  `MRB單結案狀況` varchar(10) DEFAULT NULL,
  `結案時間` date DEFAULT NULL,
  `FACA單號` varchar(20) DEFAULT NULL,
  `FACA結案狀況` varchar(10) DEFAULT NULL,
  `1年內重覆開單次數` varchar(10) DEFAULT NULL,
  `備註` longtext,
  `核定判定項目` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

## 表格: qms_mrb_drb_form_detail

```sql
CREATE TABLE `qms_mrb_drb_form_detail` (
  `id` int NOT NULL,
  `開單廠區` varchar(10) DEFAULT NULL,
  `棟別` varchar(10) DEFAULT NULL,
  `申請日期` date DEFAULT NULL,
  `EIP表單編號` varchar(20) DEFAULT NULL,
  `申請單類別` varchar(10) DEFAULT NULL,
  `申請判定項目` varchar(10) DEFAULT NULL,
  `申請單位` varchar(20) DEFAULT NULL,
  `申請人` varchar(40) DEFAULT NULL,
  `報廢種類` varchar(10) DEFAULT NULL,
  `產品類型` varchar(10) DEFAULT NULL,
  `不良種類` varchar(10) DEFAULT NULL,
  `不良大項` varchar(20) DEFAULT NULL,
  `不良細項` varchar(30) DEFAULT NULL,
  `不良項目` longtext,
  `發生原因` longtext,
  `5M1E` varchar(10) DEFAULT NULL,
  `核定判定項目` varchar(10) DEFAULT NULL,
  `改善單位` varchar(30) DEFAULT NULL,
  `改善擔當` varchar(40) DEFAULT NULL,
  `MRB單結案狀況` varchar(10) DEFAULT NULL,
  `結案時間` date DEFAULT NULL,
  `不良照片(網址)` varchar(140) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

## 表格: qms_voc_detail

```sql
CREATE TABLE `qms_voc_detail` (
  `id` int NOT NULL,
  `客戶是否知曉` varchar(10) DEFAULT NULL,
  `表單狀態` varchar(10) DEFAULT NULL,
  `廠區` varchar(10) DEFAULT NULL,
  `客訴廠區處` varchar(10) DEFAULT NULL,
  `申請部門` varchar(10) DEFAULT NULL,
  `申請者` varchar(10) DEFAULT NULL,
  `建立日期` date DEFAULT NULL,
  `表單日期` date DEFAULT NULL,
  `客訴等級` varchar(10) DEFAULT NULL,
  `客訴單號` varchar(10) DEFAULT NULL,
  `客訴日期` date DEFAULT NULL,
  `回覆客戶時效` varchar(10) DEFAULT NULL,
  `客戶類別` varchar(10) DEFAULT NULL,
  `客戶` varchar(100) DEFAULT NULL,
  `出貨LOT數` int DEFAULT NULL,
  `出貨數量` int DEFAULT NULL,
  `客端抽檢數` int DEFAULT NULL,
  `客端不良數` int DEFAULT NULL,
  `客端不良率` decimal(20,2) DEFAULT NULL,
  `交貨日期` varchar(10) DEFAULT NULL,
  `批次` varchar(10) DEFAULT NULL,
  `不良類別` varchar(10) DEFAULT NULL,
  `不良代號` varchar(10) DEFAULT NULL,
  `不良項目` varchar(10) DEFAULT NULL,
  `DPPM` int DEFAULT NULL,
  `客訴不良現象` varchar(50) DEFAULT NULL,
  `不良類別其他` varchar(50) DEFAULT NULL,
  `CAR No` varchar(20) DEFAULT NULL,
  `產品階段類別` varchar(10) DEFAULT NULL,
  `產品類別` varchar(10) DEFAULT NULL,
  `發生源-責任單位` varchar(20) DEFAULT NULL,
  `發生源-責任者` varchar(10) DEFAULT NULL,
  `FlexBug No` varchar(10) DEFAULT NULL,
  `Radar No.` varchar(20) DEFAULT NULL,
  `客戶指定納期` date DEFAULT NULL,
  `最後更改日期` date DEFAULT NULL,
  `客訴地點(發現異常地點)` varchar(20) DEFAULT NULL,
  `客訴類別` varchar(10) DEFAULT NULL,
  `客訴品目` varchar(10) DEFAULT NULL,
  `責任確認其他` varchar(50) DEFAULT NULL,
  `流出源-責任單位` varchar(20) DEFAULT NULL,
  `流出源-責任者` varchar(10) DEFAULT NULL,
  `屬於客戶的物料` varchar(20) DEFAULT NULL,
  `FlexBug 網址連結` varchar(90) DEFAULT NULL,
  `附件路徑` mediumtext,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

