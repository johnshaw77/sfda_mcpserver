/**
 * MIL 服務實作
 *
 * Mission in List（清單中的任務），表示分配到清單上的任務或專案。
 */

import databaseService from "../database.js";
import logger from "../../config/logger.js";

class MILService {
  constructor() {
    this.dbName = "mil";
  }

  /**
   * 獲取 MIL 列表
   * @param {Object} filters - 篩選條件
   * @param {number} page - 頁數 (預設為 1)
   * @param {number} limit - 每頁返回結果數量限制 (預設為 20)
   * @param {string} sort - 排序欄位 (預設為 RecordDate)
   */
  async getMILList(filters = {}, page = 1, limit = 20, sort = "RecordDate") {
    try {
      // 構建 WHERE 條件
      const whereConditions = [];

      // MIL Typename
      if (filters.typeName) {
        whereConditions.push("TypeName=@typeName");
      }
      // MIL 處理狀態篩選
      if (filters.status) {
        whereConditions.push("Status = @status");
      }

      // 提案廠別篩選
      if (filters.proposalFactory) {
        whereConditions.push("ProposalFactory = @proposalFactory");
      }

      // 提出人姓名模糊查詢
      if (filters.proposerName) {
        whereConditions.push("Proposer_Name LIKE @proposerName");
      }

      // MIL 編號模糊查詢
      if (filters.serialNumber) {
        whereConditions.push("SerialNumber LIKE @serialNumber");
      }

      // 重要度篩選
      if (filters.importance) {
        whereConditions.push("Importance = @importance");
      }

      // 延遲天數範圍篩選
      if (filters.delayDayMin !== undefined) {
        whereConditions.push("DelayDay >= @delayDayMin");
      }
      if (filters.delayDayMax !== undefined) {
        whereConditions.push("DelayDay <= @delayDayMax");
      }
      // 向後兼容舊的 delayDay 參數
      if (filters.delayDay !== undefined) {
        whereConditions.push("DelayDay >= @delayDay");
      }

      // 建構 WHERE 子句
      const whereClause =
        whereConditions.length > 0
          ? " WHERE " + whereConditions.join(" AND ")
          : "";

      // 建構主要查詢 SQL (含分頁)
      const offset = (page - 1) * limit;
      const mainQuery = `
        SELECT SerialNumber, TypeName, MidTypeName, DelayDay, naqi_num, 
               is_APPLY, Importance, Status, RecordDate, ProposalFactory,
               Proposer_EmpNo, Proposer_Name, Proposer_Dept, Proposer_Superior_Dept,
               DRI_EmpNo, DRI_EmpName, DRI_Dept, DRI_Superior_Dept,
               IssueDiscription, Remark, Location, PlanFinishDate,
               ChangeFinishDate, ActualFinishDate, Solution
        FROM v_mil_kd
        ${whereClause}
        ORDER BY ${sort} DESC
        OFFSET ${offset} ROWS 
        FETCH NEXT ${limit} ROWS ONLY
              `;

      // 建構計數查詢 SQL
      const countQuery = `SELECT COUNT(*) as total FROM v_mil_kd${whereClause}`;

      // 執行主要查詢
      const mainRequest = databaseService.getPool(this.dbName).request();
      this.setQueryParameters(mainRequest, filters);
      const result = await mainRequest.query(mainQuery);

      // 執行計數查詢
      const countRequest = databaseService.getPool(this.dbName).request();
      this.setQueryParameters(countRequest, filters);
      const countResult = await countRequest.query(countQuery);

      const totalRecords = countResult.recordset[0].total;
      const totalPages = Math.ceil(totalRecords / limit);

      logger.info("MIL 列表查詢成功", {
        count: result.recordset.length,
        totalRecords: totalRecords,
        page: page,
        totalPages: totalPages,
        filters: JSON.stringify(filters),
      });

      return {
        success: true,
        count: result.recordset.length,
        totalRecords: totalRecords,
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        timestamp: new Date().toISOString(),
        filters: filters,
        data: result.recordset, // 統一字段
      };
    } catch (error) {
      logger.error("MIL 列表查詢失敗", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 設定查詢參數的輔助方法
   * @param {Object} request - MSSQL request 物件
   * @param {Object} filters - 篩選條件
   */
  setQueryParameters(request, filters) {
    if (filters.typeName) {
      request.input("typeName", filters.typeName);
    }

    if (filters.status) {
      request.input("status", filters.status);
    }

    if (filters.proposalFactory) {
      request.input("proposalFactory", filters.proposalFactory);
    }

    if (filters.proposerName) {
      request.input("proposerName", "%" + filters.proposerName + "%");
    }

    if (filters.serialNumber) {
      request.input("serialNumber", "%" + filters.serialNumber + "%");
    }

    if (filters.importance) {
      request.input("importance", filters.importance);
    }

    // 延遲天數範圍參數
    if (filters.delayDayMin !== undefined) {
      request.input("delayDayMin", filters.delayDayMin);
    }
    if (filters.delayDayMax !== undefined) {
      request.input("delayDayMax", filters.delayDayMax);
    }
    // 向後兼容
    if (filters.delayDay !== undefined) {
      request.input("delayDay", filters.delayDay);
    }
  }

  /**
   * 獲取特定 MIL 詳情
   * @param {string} serialNumber - MIL 編號
   */
  async getMILDetails(serialNumber) {
    try {
      const request = databaseService.getPool(this.dbName).request();
      request.input("serialNumber", serialNumber);

      const sql = "SELECT * FROM v_mil_kd WHERE SerialNumber = @serialNumber";
      const result = await request.query(sql);

      if (result.recordset.length === 0) {
        logger.warn("找不到指定的 MIL", { serialNumber });
        throw new Error(`找不到 MIL 編號: ${serialNumber}`);
      }

      logger.info("MIL 詳情查詢成功", { serialNumber });

      return {
        timestamp: new Date().toISOString(),
        data: result.recordset[0], // 統一字段
      };
    } catch (error) {
      logger.error("MIL 詳情查詢失敗", {
        serialNumber,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 取得 MIL 處理狀態統計報告
   */
  async getStatusReport() {
    try {
      const sql = `
        SELECT 
          Status, 
          COUNT(*) as Count,
          AVG(DATEDIFF(day, RecordDate, GETDATE())) as AvgDays
        FROM 
          v_mil_kd 
        GROUP BY 
          Status
      `;

      const result = await databaseService
        .getPool(this.dbName)
        .request()
        .query(sql);

      logger.info("MIL 狀態報告查詢成功", {
        reportCount: result.recordset.length,
      });

      return {
        timestamp: new Date().toISOString(),
        data: result.recordset, // 統一字段
      };
    } catch (error) {
      logger.error("MIL 狀態報告查詢失敗", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * @tool-name 取得 MIL 類型列表
   * @returns {Array} MIL 類型列表
   * @description 獲取所有 MIL 類型的唯一列表v
   */
  async getMILTypeList() {
    try {
      const sql = `
        SELECT DISTINCT TypeName 
        FROM v_mil_kd 
        ORDER BY TypeName
      `;

      const result = await databaseService
        .getPool(this.dbName)
        .request()
        .query(sql);

      logger.info("MIL 類型列表查詢成功", {
        typeCount: result.recordset.length,
      });

      return {
        timestamp: new Date().toISOString(),
        data: result.recordset.map(row => row.TypeName), // 統一字段
      };
    } catch (error) {
      logger.error("MIL 類型列表查詢失敗", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 依指定欄位統計 MIL 總數
   * @tool-name get-count-by
   * @tool-description 依指定欄位（如狀態、類型、廠別等）統計 MIL 記錄數量，用於數據分析和報表生成
   * @param {string} columnName - 要統計的欄位名稱（如 Status、TypeName、ProposalFactory 等）
   * @returns {Object} 包含統計結果的物件
   */
  async getCountBy(columnName) {
    try {
      const sql = `select ${columnName},count(*) as totalCount from v_mil_kd
             group by ${columnName}`;
      const result = await databaseService
        .getPool(this.dbName)
        .request()
        .query(sql);
      logger.info("MIL 依特定欄位統計查詢成功", {
        columnCount: result.recordset.length,
      });

      return {
        timestamp: new Date().toISOString(),
        data: result.recordset, // 統一字段
      };
    } catch (error) {
      logger.error("MIL 依特定欄位統計查詢失敗", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// 創建單例實例
const milService = new MILService();

export default milService;
