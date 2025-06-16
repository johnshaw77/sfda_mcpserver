# qsm 資料庫所有表格結構

資料庫名稱: **qsm**
主機: localhost:3306
產生時間: 2025/6/15 上午12:30:09

## 目錄

1. [org_employee](#表格-org_employee)
2. [org_group](#表格-org_group)
3. [qms_mrb_detail](#表格-qms_mrb_detail)
4. [qms_mrb_drb_form_detail](#表格-qms_mrb_drb_form_detail)
5. [qms_voc_detail](#表格-qms_voc_detail)

---

## 表格: org_employee

### 表格結構

| 欄位名稱                       | 資料型別     | 可為空 | 索引 | 預設值 | 備註      |
| ------------------------------ | ------------ | ------ | ---- | ------ | --------- |
| account_guid                   | varchar(50)  | 是     |      |        |           |
| group_id                       | varchar(50)  | 是     |      |        |           |
| group_name                     | varchar(50)  | 是     |      |        | 部門名稱  |
| group_code                     | varchar(50)  | 是     |      |        | 部門代碼  |
| name                           | varchar(50)  | 是     |      |        | 姓名      |
| nickname                       | varchar(50)  | 是     |      |        | 別名      |
| account_mapping                | varchar(20)  | 是     |      |        |           |
| password                       | varchar(25)  | 是     |      |        |           |
| email                          | varchar(100) | 是     |      |        | 郵箱      |
| password_invalid_attempts      | tinyint      | 否     |      |        |           |
| pw_reset_reason                | tinyint      | 否     |      |        |           |
| is_password_reset              | bit(1)       | 是     |      |        |           |
| is_locked_out                  | bit(1)       | 是     |      |        |           |
| activity_date                  | datetime     | 是     |      |        |           |
| expire_date                    | datetime     | 是     |      |        |           |
| last_activity_date             | datetime     | 是     |      |        |           |
| last_locked_out_date           | datetime     | 是     |      |        |           |
| last_password_change_date      | datetime     | 是     |      |        |           |
| is_suspended                   | bit(1)       | 是     |      |        | 是否停用  |
| last_suspended_date            | datetime     | 是     |      |        | 停用時間  |
| is_update_personal_info        | bit(1)       | 是     |      |        |           |
| last_update_personal_info_date | varchar(50)  | 是     |      |        |           |
| user_type                      | varchar(50)  | 是     |      |        | 用戶類型  |
| card_no                        | varchar(50)  | 是     |      |        |           |
| employee_no                    | varchar(50)  | 是     |      |        | 工號      |
| domain                         | varchar(50)  | 是     |      |        | AD Domain |
| account                        | varchar(50)  | 是     |      |        | Ad 帳號   |
| ca_serial_num                  | varchar(50)  | 是     |      |        |           |
| is_usb_auth                    | bit(1)       | 是     |      |        |           |
| usb_key                        | varchar(50)  | 是     |      |        |           |
| lang                           | varchar(50)  | 是     |      |        | 語系      |
| email_a                        | varchar(50)  | 是     |      |        |           |
| email_b                        | varchar(50)  | 是     |      |        |           |
| email_c                        | varchar(50)  | 是     |      |        |           |
| email_d                        | varchar(50)  | 是     |      |        |           |
| address                        | varchar(50)  | 是     |      |        | 住址      |
| arrive_date                    | datetime     | 是     |      |        | 到職日期  |
| leave_date                     | datetime     | 是     |      |        | 離職日期  |
| birthday                       | date         | 是     |      |        | 生日      |
| sex                            | varchar(5)   | 是     |      |        | 姓別      |
| telphone                       | varchar(50)  | 是     |      |        | 公司電話  |
| ext_num                        | varchar(50)  | 是     |      |        | 公司桌機  |
| mobile                         | varchar(50)  | 是     |      |        | 手機      |
| photo                          | varchar(50)  | 是     |      |        |           |
| signature                      | varchar(50)  | 是     |      |        |           |
| line                           | varchar(50)  | 是     |      |        |           |
| skype                          | varchar(50)  | 是     |      |        |           |
| wechat                         | varchar(50)  | 是     |      |        |           |
| updated_at                     | datetime     | 是     |      |        |           |
| title_name                     | varchar(100) | 是     |      |        |           |
| title_rank                     | tinyint      | 是     |      |        |           |

### 索引信息

此表格沒有索引

## 表格: org_group

### 表格結構

| 欄位名稱        | 資料型別    | 可為空 | 索引 | 預設值 | 備註 |
| --------------- | ----------- | ------ | ---- | ------ | ---- |
| group_id        | varchar(50) | 是     |      |        |      |
| group_type      | varchar(10) | 是     |      |        |      |
| group_name      | varchar(50) | 是     |      |        |      |
| parent_group_id | varchar(50) | 是     |      |        |      |
| lft             | tinyint     | 是     |      |        |      |
| rgt             | tinyint     | 是     |      |        |      |
| lev             | tinyint     | 是     |      |        |      |
| group_code      | varchar(50) | 是     |      |        |      |
| active          | bit(1)      | 是     |      |        |      |
| company_id      | varchar(50) | 是     |      |        |      |
| updated_at      | datetime    | 是     |      |        |      |

### 索引信息

此表格沒有索引

## 表格: qms_mrb_detail

### 表格結構

| 欄位名稱            | 資料型別      | 可為空 | 索引 | 預設值 | 備註 |
| ------------------- | ------------- | ------ | ---- | ------ | ---- |
| id                  | int           | 否     |      |        |      |
| 開單廠區            | varchar(10)   | 是     |      |        |      |
| 棟別                | varchar(10)   | 是     |      |        |      |
| EIP表單編號         | varchar(20)   | 是     |      |        |      |
| 申請單類別          | varchar(10)   | 是     |      |        |      |
| 申請判定項目        | varchar(10)   | 是     |      |        |      |
| 報廢種類            | varchar(10)   | 是     |      |        |      |
| 不良種類            | varchar(20)   | 是     |      |        |      |
| 申請單位            | varchar(20)   | 是     |      |        |      |
| 發現單位            | varchar(40)   | 是     |      |        |      |
| 申請人              | varchar(40)   | 是     |      |        |      |
| 申請日期            | date          | 是     |      |        |      |
| 編碼周別            | tinyint       | 是     |      |        |      |
| 異常發生日期        | date          | 是     |      |        |      |
| 產品類型            | varchar(10)   | 是     |      |        |      |
| 製程品類            | varchar(10)   | 是     |      |        |      |
| 品目                | varchar(10)   | 是     |      |        |      |
| 品目版本            | varchar(20)   | 是     |      |        |      |
| 版本                | varchar(10)   | 是     |      |        |      |
| 不良代碼            | varchar(10)   | 是     |      |        |      |
| 不良大項            | varchar(20)   | 是     |      |        |      |
| 不合格項目(細項)    | varchar(80)   | 是     |      |        |      |
| 不良項目            | longtext      | 是     |      |        |      |
| 發生原因            | longtext      | 是     |      |        |      |
| 圖程                | varchar(10)   | 是     |      |        |      |
| 圖程說明            | varchar(30)   | 是     |      |        |      |
| 工單類別(0:正.1:再) | tinyint       | 是     |      |        |      |
| 不良制番            | varchar(10)   | 是     |      |        |      |
| PNL 生產數          | smallint      | 是     |      |        |      |
| PCS生產數           | int           | 是     |      |        |      |
| 不良率              | decimal(20,6) | 是     |      |        |      |
| 責任佔比(率)        | decimal(20,6) | 是     |      |        |      |
| 責任單位            | varchar(100)  | 是     |      |        |      |
| 異常LOT數           | decimal(20,6) | 是     |      |        |      |
| PNL不良數           | smallint      | 是     |      |        |      |
| PCS不良數           | int           | 是     |      |        |      |
| 造成損失金額(台幣)  | int           | 是     |      |        |      |
| 5M1E                | varchar(10)   | 是     |      |        |      |
| PM設備編號          | varchar(20)   | 是     |      |        |      |
| PM設備名稱          | varchar(50)   | 是     |      |        |      |
| 改善單位            | varchar(40)   | 是     |      |        |      |
| 改善擔當            | varchar(40)   | 是     |      |        |      |
| MRB單結案狀況       | varchar(10)   | 是     |      |        |      |
| 結案時間            | date          | 是     |      |        |      |
| FACA單號            | varchar(20)   | 是     |      |        |      |
| FACA結案狀況        | varchar(10)   | 是     |      |        |      |
| 1年內重覆開單次數   | varchar(10)   | 是     |      |        |      |
| 備註                | longtext      | 是     |      |        |      |
| 核定判定項目        | varchar(10)   | 是     |      |        |      |
| created_at          | datetime      | 是     |      |        |      |

### 索引信息

此表格沒有索引

## 表格: qms_mrb_drb_form_detail

### 表格結構

| 欄位名稱       | 資料型別     | 可為空 | 索引 | 預設值 | 備註 |
| -------------- | ------------ | ------ | ---- | ------ | ---- |
| id             | int          | 否     |      |        |      |
| 開單廠區       | varchar(10)  | 是     |      |        |      |
| 棟別           | varchar(10)  | 是     |      |        |      |
| 申請日期       | date         | 是     |      |        |      |
| EIP表單編號    | varchar(20)  | 是     |      |        |      |
| 申請單類別     | varchar(10)  | 是     |      |        |      |
| 申請判定項目   | varchar(10)  | 是     |      |        |      |
| 申請單位       | varchar(20)  | 是     |      |        |      |
| 申請人         | varchar(40)  | 是     |      |        |      |
| 報廢種類       | varchar(10)  | 是     |      |        |      |
| 產品類型       | varchar(10)  | 是     |      |        |      |
| 不良種類       | varchar(10)  | 是     |      |        |      |
| 不良大項       | varchar(20)  | 是     |      |        |      |
| 不良細項       | varchar(30)  | 是     |      |        |      |
| 不良項目       | longtext     | 是     |      |        |      |
| 發生原因       | longtext     | 是     |      |        |      |
| 5M1E           | varchar(10)  | 是     |      |        |      |
| 核定判定項目   | varchar(10)  | 是     |      |        |      |
| 改善單位       | varchar(30)  | 是     |      |        |      |
| 改善擔當       | varchar(40)  | 是     |      |        |      |
| MRB單結案狀況  | varchar(10)  | 是     |      |        |      |
| 結案時間       | date         | 是     |      |        |      |
| 不良照片(網址) | varchar(140) | 是     |      |        |      |
| created_at     | datetime     | 是     |      |        |      |

### 索引信息

此表格沒有索引

## 表格: qms_voc_detail

### 表格結構

| 欄位名稱               | 資料型別      | 可為空 | 索引 | 預設值 | 備註 |
| ---------------------- | ------------- | ------ | ---- | ------ | ---- |
| id                     | int           | 否     |      |        |      |
| 客戶是否知曉           | varchar(10)   | 是     |      |        |      |
| 表單狀態               | varchar(10)   | 是     |      |        |      |
| 廠區                   | varchar(10)   | 是     |      |        |      |
| 客訴廠區處             | varchar(10)   | 是     |      |        |      |
| 申請部門               | varchar(10)   | 是     |      |        |      |
| 申請者                 | varchar(10)   | 是     |      |        |      |
| 建立日期               | date          | 是     |      |        |      |
| 表單日期               | date          | 是     |      |        |      |
| 客訴等級               | varchar(10)   | 是     |      |        |      |
| 客訴單號               | varchar(10)   | 是     |      |        |      |
| 客訴日期               | date          | 是     |      |        |      |
| 回覆客戶時效           | varchar(10)   | 是     |      |        |      |
| 客戶類別               | varchar(10)   | 是     |      |        |      |
| 客戶                   | varchar(100)  | 是     |      |        |      |
| 出貨LOT數              | int           | 是     |      |        |      |
| 出貨數量               | int           | 是     |      |        |      |
| 客端抽檢數             | int           | 是     |      |        |      |
| 客端不良數             | int           | 是     |      |        |      |
| 客端不良率             | decimal(20,2) | 是     |      |        |      |
| 交貨日期               | varchar(10)   | 是     |      |        |      |
| 批次                   | varchar(10)   | 是     |      |        |      |
| 不良類別               | varchar(10)   | 是     |      |        |      |
| 不良代號               | varchar(10)   | 是     |      |        |      |
| 不良項目               | varchar(10)   | 是     |      |        |      |
| DPPM                   | int           | 是     |      |        |      |
| 客訴不良現象           | varchar(50)   | 是     |      |        |      |
| 不良類別其他           | varchar(50)   | 是     |      |        |      |
| CAR No                 | varchar(20)   | 是     |      |        |      |
| 產品階段類別           | varchar(10)   | 是     |      |        |      |
| 產品類別               | varchar(10)   | 是     |      |        |      |
| 發生源-責任單位        | varchar(20)   | 是     |      |        |      |
| 發生源-責任者          | varchar(10)   | 是     |      |        |      |
| FlexBug No             | varchar(10)   | 是     |      |        |      |
| Radar No.              | varchar(20)   | 是     |      |        |      |
| 客戶指定納期           | date          | 是     |      |        |      |
| 最後更改日期           | date          | 是     |      |        |      |
| 客訴地點(發現異常地點) | varchar(20)   | 是     |      |        |      |
| 客訴類別               | varchar(10)   | 是     |      |        |      |
| 客訴品目               | varchar(10)   | 是     |      |        |      |
| 責任確認其他           | varchar(50)   | 是     |      |        |      |
| 流出源-責任單位        | varchar(20)   | 是     |      |        |      |
| 流出源-責任者          | varchar(10)   | 是     |      |        |      |
| 屬於客戶的物料         | varchar(20)   | 是     |      |        |      |
| FlexBug 網址連結       | varchar(90)   | 是     |      |        |      |
| 附件路徑               | mediumtext    | 是     |      |        |      |
| created_at             | datetime      | 是     |      |        |      |

### 索引信息

此表格沒有索引
