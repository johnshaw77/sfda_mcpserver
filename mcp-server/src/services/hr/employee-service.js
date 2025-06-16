/**
 * 員工資料服務
 *
 * 提供與員工資料相關的資料庫操作功能
 *
 * 資料庫欄位映射:
 * - name -> 姓名
 * - nickname -> 別名 (英文名)
 * - group_name -> 部門名稱
 * - group_code -> 部門代碼
 * - email -> 電子郵件
 * - is_suspended -> 是否停用
 * - last_suspended_date -> 停用時間
 * - user_type -> 用戶類型
 * - employee_no -> 工號
 * - domain -> AD Domain
 * - account -> AD 帳號
 * - lang -> 語系
 * - address -> 住址
 * - arrive_date -> 到職日期
 * - leave_date -> 離職日期
 * - birthday -> 生日
 * - sex -> 性別
 * - telphone -> 公司電話
 * - ext_num -> 公司桌機
 * - mobile -> 手機
 * - title_name -> 職位名稱
 *
 * 返回資料結構映射:
 * - basic: 基本資料 (姓名、工號、性別、生日、是否停用)
 * - contact: 聯絡方式 (郵箱、公司電話、公司桌機、手機、住址)
 * - department: 部門資訊 (部門名稱、部門代碼)
 * - position: 職位資訊 (職位名稱、用戶類型)
 * - employment: 雇用資訊 (到職日期、離職日期、停用時間、AD Domain、AD 帳號、語系)
 */

import databaseService from "../database.js";
import logger from "../../config/logger.js";

class EmployeeService {
  /**
   * 根據員工ID獲取員工資料
   * @param {string} employeeNo - 員工編號
   * @param {boolean} includeDetails - 是否包含詳細資訊
   * @param {Array<string>} fields - 需要的資料欄位類別
   * @returns {Object} 員工資料
   */
  async getEmployeeById(
    employeeNo,
    includeDetails = true,
    fields = ["basic", "contact", "department", "position"], //TODO: ??
  ) {
    try {
      logger.debug(`Fetching employee data from database for: ${employeeNo}`, {
        service: "EmployeeService",
        method: "getEmployeeById",
        employeeNo,
        includeDetails,
        fields,
      });

      // 確保資料庫服務已初始化
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }

      // 根據員工編號查詢資料 (使用 employee_no 欄位)
      const query = `
        SELECT 
          name, nickname, email, is_suspended, last_suspended_date, 
          user_type, employee_no, domain, account, lang, 
          address, arrive_date, leave_date, birthday, sex, 
          telphone, ext_num, mobile, title_name, group_name, group_code
        FROM 
          org_employee
        WHERE 
          employee_no = ?
          AND name NOT LIKE '%test%'
      `;

      // 執行查詢
      const results = await databaseService.query("qms", query, [employeeNo]);

      // 如果查無員工資料
      if (!results || results.length === 0) {
        logger.warn(`Employee not found in database: ${employeeNo}`, {
          service: "EmployeeService",
          method: "getEmployeeById",
          employeeNo,
        });
        return null;
      }

      // 處理查詢結果
      const employeeData = results[0];
      logger.info(`Employee data retrieved successfully: ${employeeNo}`, {
        service: "EmployeeService",
        method: "getEmployeeById",
        employeeNo,
        name: employeeData.name,
      });

      // 按欄位分類組織資料
      return this._formatEmployeeData(employeeData, includeDetails, fields);
    } catch (error) {
      logger.error(`Error fetching employee data: ${error.message}`, {
        service: "EmployeeService",
        method: "getEmployeeById",
        employeeId,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 格式化員工資料
   * @private
   */
  _formatEmployeeData(rawData, includeDetails, fields) {
    // 建立資料分類結構
    const formattedData = {};

    // 如果不需要詳細資訊，只返回基本資料
    if (!includeDetails) {
      return {
        basic: {
          employeeNo: rawData.employee_no,
          name: rawData.name,
          nickName: rawData.nickname || null,
        },
      };
    }

    // 根據請求的欄位組織資料
    for (const field of fields) {
      switch (field) {
        case "basic":
          formattedData.basic = {
            employeeNo: rawData.employee_no,
            name: rawData.name,
            nickName: rawData.nickname || null,
            sex: rawData.sex,
            birthday: rawData.birthday
              ? this._formatDate(rawData.birthday)
              : null,
            isSuspended: Boolean(rawData.is_suspended),
          };
          break;

        case "contact":
          formattedData.contact = {
            email: rawData.email,
            mobile: rawData.mobile,
            telphone: rawData.telphone,
            extNum: rawData.ext_num,
            address: rawData.address,
          };
          break;

        case "department":
          formattedData.department = {
            groupName: rawData.group_name,
            groupCode: rawData.group_code,
          };
          break;

        case "position":
          formattedData.position = {
            titleName: rawData.title_name,
            userType: rawData.user_type,
          };
          break;

        case "employment":
          formattedData.employment = {
            arriveDate: rawData.arrive_date
              ? this._formatDate(rawData.arrive_date)
              : null,
            leaveDate: rawData.leave_date
              ? this._formatDate(rawData.leave_date)
              : null,
            lastSuspendedDate: rawData.last_suspended_date
              ? this._formatDate(rawData.last_suspended_date)
              : null,
            domain: rawData.domain,
            account: rawData.account,
            lang: rawData.lang,
          };
          break;
      }
    }

    return formattedData;
  }

  /**
   * 格式化日期為 ISO 字串
   * @private
   */
  _formatDate(date) {
    if (!date) return null;

    // 如果已經是字串格式但不是ISO格式，嘗試轉換
    if (typeof date === "string") {
      // 嘗試使用 Date 物件解析並格式化
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split("T")[0]; // 僅返回日期部分 YYYY-MM-DD
      }
      return date;
    }

    // 如果是 Date 物件
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }

    return null;
  }

  /**
   * 獲取員工列表
   * @param {Object} filters - 過濾條件
   * @param {number} page - 頁碼
   * @param {number} limit - 每頁筆數
   * @param {boolean} includeDetails - 是否包含詳細資訊
   * @returns {Object} 員工列表資料
   */
  async getEmployeeList(
    filters = {},
    page = 1,
    limit = 20,
    includeDetails = false,
  ) {
    try {
      logger.debug("Fetching employee list from database", {
        service: "EmployeeService",
        method: "getEmployeeList",
        filters,
        page,
        limit,
      });

      // 確保資料庫服務已初始化
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }

      // 建立基本查詢
      let query = `
        SELECT 
          name, nickname, email, is_suspended, 
          user_type, employee_no, title_name, group_name, group_code
        FROM 
          org_employee
        WHERE 1=1
        AND name NOT LIKE '%test%'
      `;

      // 準備查詢參數
      const params = [];

      // 根據過濾條件增加 WHERE 條件
      if (filters.department) {
        // 支援同時查詢部門代碼或名稱
        query += " AND (group_code = ? OR group_name LIKE ?)";
        params.push(filters.department);
        params.push(`%${filters.department}%`);
      }

      // 支援同時使用 titleName 或 jobTitle 參數
      const titleFilter = filters.titleName || filters.jobTitle;
      if (titleFilter) {
        query += " AND title_name LIKE ?";
        params.push(`%${titleFilter}%`);
      }

      if (filters.status && filters.status !== "all") {
        if (filters.status === "active") {
          query += " AND (is_suspended IS NULL OR is_suspended = 0)";
        } else if (filters.status === "inactive") {
          query += " AND is_suspended = 1";
        }
      }

      // 添加總數查詢
      const countQuery = query.replace(
        "SELECT \n          name, nickname, email, is_suspended, \n          user_type, employee_no, title_name, group_name, group_code",
        "SELECT COUNT(*) as total",
      );

      // 查詢總數
      const countResults = await databaseService.query(
        "qms",
        countQuery,
        params,
      );
      const total = countResults[0]?.total || 0;

      // 添加分頁 - 使用直接的數字而不是參數
      const offset = (page - 1) * limit;
      query += ` ORDER BY name LIMIT ${limit} OFFSET ${offset}`;

      // 執行查詢
      const results = await databaseService.query("qms", query, params);

      // 格式化結果
      const employees = results.map(employee => {
        const formattedEmployee = {
          employeeNo: employee.employee_no,
          name: employee.name,
          groupName: employee.group_name,
          groupCode: employee.group_code,
          titleName: employee.title_name,
          isActive: !employee.is_suspended,
        };

        // 如果需要詳細資訊，增加更多欄位
        if (includeDetails) {
          formattedEmployee.details = {
            email: employee.email,
            nickName: employee.nickname,
            userType: employee.user_type,
          };
        }

        return formattedEmployee;
      });

      logger.info(
        `Employee list retrieved successfully: ${employees.length} employees`,
        {
          service: "EmployeeService",
          method: "getEmployeeList",
          count: employees.length,
          total,
        },
      );

      return {
        employees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching employee list: ${error.message}`, {
        service: "EmployeeService",
        method: "getEmployeeList",
        filters,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 透過姓名或部門查詢員工
   * @param {Object} filters - 過濾條件 (name, department, status)
   * @param {number} limit - 最多返回幾筆結果
   * @returns {Object} 查詢結果
   */
  async findEmployeesByNameOrDepartment(filters = {}, limit = 5) {
    try {
      logger.debug("Searching employees by name or department", {
        service: "EmployeeService",
        method: "findEmployeesByNameOrDepartment",
        filters,
        limit,
      });

      // 確保資料庫服務已初始化
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }

      // 建立基本查詢
      let query = `
        SELECT 
          name, employee_no, title_name, group_name, group_code, is_suspended
        FROM 
          org_employee
        WHERE 1=1
        AND name NOT LIKE '%test%'
      `;

      // 準備查詢參數
      const params = [];

      // 根據過濾條件增加 WHERE 條件
      if (filters.name) {
        query += " AND name LIKE ?";
        params.push(`%${filters.name}%`);
      }

      if (filters.department) {
        query += " AND (group_code = ? OR group_name LIKE ?)";
        params.push(filters.department);
        params.push(`%${filters.department}%`);
      }

      // 根據狀態過濾
      if (filters.status && filters.status !== "all") {
        if (filters.status === "active") {
          query += " AND (is_suspended IS NULL OR is_suspended = 0)";
        } else if (filters.status === "inactive") {
          query += " AND is_suspended = 1";
        }
      }

      // 添加排序和限制 - 使用直接數字而不是參數
      query += ` ORDER BY name LIMIT ${limit}`;

      // 執行查詢
      const results = await databaseService.query("qms", query, params);

      // 格式化結果
      const employees = results.map(employee => ({
        employeeNo: employee.employee_no,
        name: employee.name,
        groupName: employee.group_name,
        groupCode: employee.group_code,
        titleName: employee.title_name,
        isActive: !employee.is_suspended,
      }));

      logger.info(`Found ${employees.length} employees matching criteria`, {
        service: "EmployeeService",
        method: "findEmployeesByNameOrDepartment",
        count: employees.length,
      });

      return {
        employees,
        count: employees.length,
      };
    } catch (error) {
      logger.error(`Error searching employees: ${error.message}`, {
        service: "EmployeeService",
        method: "findEmployeesByNameOrDepartment",
        filters,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 計算員工總數
   * @param {string} status - 員工狀態：active(在職)、inactive(離職/停用)、all(全部)
   * @returns {Object} 包含員工總數的對象
   */
  async getEmployeeCount(status = "all") {
    try {
      logger.debug("Counting employees in database", {
        service: "EmployeeService",
        method: "getEmployeeCount",
        status,
      });

      // 確保資料庫服務已初始化
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }

      // 建立基本查詢（排除測試帳號）
      let query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_suspended = 0 OR is_suspended IS NULL THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END) as inactive_count,
          SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) as female_count
        FROM 
          org_employee
        WHERE
          name NOT LIKE '%test%'
      `;

      // 如果需要根據狀態過濾
      if (status !== "all") {
        if (status === "active") {
          query = `
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) as male_count,
              SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) as female_count
            FROM 
              org_employee
            WHERE 
              (is_suspended = 0 OR is_suspended IS NULL)
              AND name NOT LIKE '%test%'
          `;
        } else if (status === "inactive") {
          query = `
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) as male_count,
              SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) as female_count
            FROM 
              org_employee
            WHERE 
              is_suspended = 1
              AND name NOT LIKE '%test%'
          `;
        }
      }

      // 執行查詢
      const results = await databaseService.query("qms", query, []);

      // 根據查詢類型處理結果
      let countResult;
      if (status === "all") {
        countResult = {
          total: results[0].total || 0,
          activeCount: results[0].active_count || 0,
          inactiveCount: results[0].inactive_count || 0,
          maleCount: results[0].male_count || 0,
          femaleCount: results[0].female_count || 0,
        };
      } else {
        countResult = {
          total: results[0].total || 0,
          maleCount: results[0].male_count || 0,
          femaleCount: results[0].female_count || 0,
        };
      }

      logger.info(
        `Employee count retrieved successfully: ${JSON.stringify(countResult)}`,
        {
          service: "EmployeeService",
          method: "getEmployeeCount",
          status,
        },
      );

      return countResult;
    } catch (error) {
      logger.error(`Error counting employees: ${error.message}`, {
        service: "EmployeeService",
        method: "getEmployeeCount",
        status,
        error: error.stack,
      });
      throw error;
    }
  }
}

// 導出單例實例
const employeeService = new EmployeeService();
export default employeeService;
