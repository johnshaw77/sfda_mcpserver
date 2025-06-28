/**
 * MIL 服務實作
 *
 * Mission in List（清單中的任務），表示分配到清單上的任務或專案。
 */

import databaseService from "../database.js";
import logger from "../../config/logger.js";
import { GetMILListTool } from "../../tools/mil/get-mil-list.js";

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
   * @param {string} status - MIL 處理狀態 (預設為 "OnGoing"，可選值: "OnGoing", "Closed")
   * @param {Array} selectedFields - 要返回的欄位列表 (選填，預設返回核心欄位)
   */
  async getMILList(
    filters = {},
    page = 1,
    limit = 20,
    sort = "RecordDate",
    status = "OnGoing",
    selectedFields = null,
  ) {
    try {
      console.log("getMILList", { status });
      // 構建 WHERE 條件
      const whereConditions = [];

      // 添加 status 參數處理
      if (status) {
        whereConditions.push("Status = @status");
      }

      // MIL Typename
      if (filters.typeName) {
        whereConditions.push("TypeName=@typeName");
      }
      // MIL 處理狀態篩選 (保留原有的 filters.status 支持)
      if (filters.status) {
        whereConditions.push("Status = @filterStatus");
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

      // 負責人相關篩選
      if (filters.driName) {
        whereConditions.push("DRI_EmpName LIKE @driName");
      }
      if (filters.driEmpNo) {
        whereConditions.push("DRI_EmpNo = @driEmpNo");
      }
      if (filters.driDept) {
        whereConditions.push("DRI_Dept = @driDept");
      }

      // 地點相關篩選
      if (filters.location) {
        whereConditions.push("Location LIKE @location");
      }

      // 申請結案狀態篩選
      if (filters.isApply) {
        whereConditions.push("is_APPLY = @isApply");
      }

      // 建構 WHERE 子句
      const whereClause =
        whereConditions.length > 0
          ? " WHERE " + whereConditions.join(" AND ")
          : "";

      console.log("where", whereClause);

      // 🎯 動態欄位選擇邏輯
      let selectFields;
      if (selectedFields && selectedFields.length > 0) {
        // 用戶指定了欄位，進行欄位對應
        const fieldMapping = {
          SerialNumber: "SerialNumber",
          TypeName: "TypeName",
          MidTypeName: "MidTypeName",
          DelayDay: "DelayDay",
          is_APPLY: "is_APPLY",
          Importance: "Importance",
          Status: "Status",
          RecordDate: "FORMAT(RecordDate, 'yyyy-MM-dd') as RecordDate",
          ProposalFactory: `CASE 
            WHEN ProposalFactory = 'JK' THEN '郡昆'
            WHEN ProposalFactory = 'KH' THEN '高雄'
            WHEN ProposalFactory = 'KS' THEN '昆山'
            ELSE '-'
          END AS ProposalFactory`,
          Proposer_EmpNo: "Proposer_EmpNo",
          Proposer_Name: "Proposer_Name",
          Proposer_Dept: "Proposer_Dept",
          Proposer_Superior_Dept: "Proposer_Superior_Dept",
          DRI_EmpNo: "DRI_EmpNo",
          DRI_EmpName: "DRI_EmpName",
          DRI_Dept: "DRI_Dept",
          DRI_Superior_Dept: "DRI_Superior_Dept",
          IssueDiscription: "IssueDiscription",
          Remark: "Remark",
          Location: "Location",
          PlanFinishDate:
            "FORMAT(PlanFinishDate, 'yyyy-MM-dd') as PlanFinishDate",
          ChangeFinishDate:
            "FORMAT(ChangeFinishDate, 'yyyy-MM-dd') as ChangeFinishDate",
          ActualFinishDate:
            "FORMAT(ActualFinishDate, 'yyyy-MM-dd') as ActualFinishDate",
          Solution: "Solution",
        };

        // 根據用戶選擇的欄位構建SQL
        const mappedFields = selectedFields
          .map(field => fieldMapping[field])
          .filter(field => field); // 過濾無效欄位

        selectFields = mappedFields.join(", ");
        console.log(`🎯 用戶指定欄位: ${selectedFields.join(", ")}`);
        console.log(`📝 映射後SQL欄位: ${selectFields}`);
      } else {
        selectFields = `SerialNumber, TypeName, Status,
          Proposer_Name, Proposer_Dept, DelayDay,
                       CASE 
                         WHEN ProposalFactory = 'JK' THEN '郡昆'
                         WHEN ProposalFactory = 'KH' THEN '高雄'
                         WHEN ProposalFactory = 'KS' THEN '昆山'
                         ELSE '-'
                       END AS ProposalFactory,
                       Importance, is_APPLY, MidTypeName,
                       FORMAT(RecordDate, 'yyyy-MM-dd') as RecordDate,
                       PlanFinishDate, IssueDiscription,
                       DRI_EmpName, DRI_Dept, DRI_Superior_Dept,
                       Location, Remark
                       `;
      }

      // 建構主要查詢 SQL (含分頁)
      const offset = (page - 1) * limit;
      const mainQuery = `
        SELECT ${selectFields}
        FROM v_mil_kd
        ${whereClause}
        ORDER BY ${sort} DESC
        OFFSET @offset ROWS 
        FETCH NEXT @limit ROWS ONLY
      `;

      // 建構計數查詢 SQL
      const countQuery = `SELECT COUNT(*) as total FROM v_mil_kd${whereClause}`;

      // 執行主要查詢
      const mainRequest = databaseService.getPool(this.dbName).request();
      this.setQueryParameters(mainRequest, filters, status);
      // 添加分頁參數
      mainRequest.input("offset", offset);
      mainRequest.input("limit", limit);

      console.log("mainQuery", mainQuery);
      const result = await mainRequest.query(mainQuery);

      // 執行計數查詢
      const countRequest = databaseService.getPool(this.dbName).request();
      this.setQueryParameters(countRequest, filters, status);
      const countResult = await countRequest.query(countQuery);

      const totalRecords = countResult.recordset[0].total;
      const totalPages = Math.ceil(totalRecords / limit);

      // 📊 添加統計摘要查詢（基於相同的篩選條件）
      const statsQuery = `
        SELECT 
          COUNT(*) as totalCount,
          AVG(CAST(DelayDay as FLOAT)) as avgDelayDays,
          MIN(DelayDay) as minDelayDays,
          MAX(DelayDay) as maxDelayDays,
          SUM(CASE WHEN DelayDay > 10 THEN 1 ELSE 0 END) as highRiskCount,
          SUM(CASE WHEN DelayDay > 0 THEN 1 ELSE 0 END) as delayedCount,
          SUM(CASE WHEN DelayDay <= 0 THEN 1 ELSE 0 END) as onTimeOrEarlyCount,
          COUNT(DISTINCT DRI_EmpName) as uniqueDRICount,
          COUNT(DISTINCT DRI_Dept) as uniqueDeptCount
        FROM v_mil_kd
        ${whereClause}
      `;

      const statsRequest = databaseService.getPool(this.dbName).request();
      this.setQueryParameters(statsRequest, filters, status);
      const statsResult = await statsRequest.query(statsQuery);
      const stats = statsResult.recordset[0];

      // 🎯 生成智能摘要文字（根據數據動態生成）
      const generateSummary = (stats, filters) => {
        const summaryParts = [];

        if (filters.delayDayMin !== undefined) {
          summaryParts.push(
            `延遲天數 ≥ ${filters.delayDayMin} 天的專案共 ${stats.totalCount} 筆`,
          );
        } else {
          summaryParts.push(`查詢到 ${stats.totalCount} 筆專案`);
        }

        if (stats.totalCount > 0) {
          summaryParts.push(
            `平均延遲 ${Math.round(stats.avgDelayDays * 10) / 10} 天`,
          );

          if (stats.highRiskCount > 0) {
            summaryParts.push(
              `⚠️ 高風險專案 ${stats.highRiskCount} 筆（延遲>10天）`,
            );
          }

          if (stats.delayedCount > 0) {
            summaryParts.push(`延遲專案 ${stats.delayedCount} 筆`);
          }

          summaryParts.push(`涉及 ${stats.uniqueDRICount} 位負責人`);
          summaryParts.push(`橫跨 ${stats.uniqueDeptCount} 個部門`);
        }

        return summaryParts.join("，") + "。";
      };

      const intelligentSummary = generateSummary(stats, filters);

      // 🤖 重構：動態生成 AI 指導提示詞（只保留動態部分）
      const generateDynamicInstructions = (stats, filters, data) => {
        const dynamicInstructions = [];

        // 根據延遲天數條件調整重點
        if (filters.delayDayMin >= 10) {
          dynamicInstructions.push("🚨 **高風險專案重點**：");
          dynamicInstructions.push(
            `- 這些專案延遲≥${filters.delayDayMin}天，屬於高風險狀態`,
          );
          dynamicInstructions.push(
            "- 分析延遲原因：資源不足、技術困難、溝通問題等",
          );
          dynamicInstructions.push("- 評估 DRI 負責人的工作負荷分配");
          dynamicInstructions.push("- 提供立即可執行的風險控制措施");
          dynamicInstructions.push("");
        } else if (stats.highRiskCount > 0) {
          dynamicInstructions.push("⚠️ **風險評估重點**：");
          dynamicInstructions.push(
            `- 發現 ${stats.highRiskCount} 個高風險專案（延遲>10天）`,
          );
          dynamicInstructions.push("- 分析高風險專案的共同特徵");
          dynamicInstructions.push("- 識別潛在的系統性問題");
          dynamicInstructions.push("");
        }

        // 根據地點條件添加特殊指導
        if (filters.location) {
          dynamicInstructions.push("🏭 **地點分析重點**：");
          dynamicInstructions.push(
            `- 專注於 ${filters.location} 地點的專案狀況`,
          );
          dynamicInstructions.push("- 評估該地點的資源配置和執行能力");
          dynamicInstructions.push("- 識別地點特有的挑戰和解決方案");
          dynamicInstructions.push("");
        }

        // 根據負責人情況添加指導
        if (stats.uniqueDRICount <= 3) {
          dynamicInstructions.push("💼 **負責人分析**：");
          dynamicInstructions.push("- 負責人集中度高，檢視工作負荷分配");
          dynamicInstructions.push("- 評估是否需要增加人力資源");
        } else if (stats.uniqueDRICount > 10) {
          dynamicInstructions.push("👥 **協調管理**：");
          dynamicInstructions.push("- 涉及多位負責人，關注協調和溝通機制");
          dynamicInstructions.push("- 建議建立統一的專案追蹤體系");
        }

        // 根據專案類型添加指導
        if (filters.typeName) {
          dynamicInstructions.push("");
          dynamicInstructions.push("📋 **專案類型重點**：");
          dynamicInstructions.push(
            `- 聚焦於 ${filters.typeName} 類型專案的特殊需求`,
          );
          dynamicInstructions.push("- 分析該類型專案的典型挑戰");
        }

        return dynamicInstructions.join("\n");
      };

      // 🎯 使用混合架構：從 Tool 獲取基礎指導，合併動態指導
      const milTool = new GetMILListTool();
      const baseInstructions = milTool.getBaseInstructions();

      const dynamicInstructions = generateDynamicInstructions(
        stats,
        filters,
        result.recordset,
      );

      // 合併基礎指導和動態指導
      const aiInstructions = dynamicInstructions
        ? `${baseInstructions}🧠 **動態分析指導**：\n${dynamicInstructions}`
        : baseInstructions;

      logger.info("MIL 列表查詢成功", {
        count: result.recordset.length,
        totalRecords: totalRecords,
        page: page,
        totalPages: totalPages,
        status: status,
        filters: JSON.stringify(filters),
        stats: stats,
      });

      return {
        success: true,
        count: result.recordset.length,
        totalRecords: totalRecords,
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        status: status,
        timestamp: new Date().toISOString(),
        filters: filters,
        data: result.recordset,

        // 📊 新增：統計摘要資訊
        statistics: {
          summary: intelligentSummary,
          details: {
            totalCount: stats.totalCount,
            avgDelayDays: Math.round(stats.avgDelayDays * 10) / 10,
            delayRange: {
              min: stats.minDelayDays,
              max: stats.maxDelayDays,
            },
            riskAnalysis: {
              highRisk: stats.highRiskCount, // 延遲 > 10 天
              delayed: stats.delayedCount, // 延遲 > 0 天
              onTimeOrEarly: stats.onTimeOrEarlyCount, // 延遲 <= 0 天
            },
            responsibility: {
              uniqueDRICount: stats.uniqueDRICount,
              uniqueDeptCount: stats.uniqueDeptCount,
            },
          },
        },

        // 🤖 新增：AI 指導提示詞
        aiInstructions: aiInstructions,
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
   * @param {string} status - MIL 處理狀態
   */
  setQueryParameters(request, filters, status) {
    // 添加 status 參數
    if (status) {
      request.input("status", status);
    }

    if (filters.typeName) {
      request.input("typeName", filters.typeName);
    }

    // 保留原有的 filters.status 支持，使用不同的參數名避免衝突
    if (filters.status) {
      request.input("filterStatus", filters.status);
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

    // 負責人相關參數
    if (filters.driName) {
      request.input("driName", "%" + filters.driName + "%");
    }
    if (filters.driEmpNo) {
      request.input("driEmpNo", filters.driEmpNo);
    }
    if (filters.driDept) {
      request.input("driDept", filters.driDept);
    }

    // 地點相關參數
    if (filters.location) {
      request.input("location", "%" + filters.location + "%");
    }

    // 申請結案狀態參數
    if (filters.isApply) {
      request.input("isApply", filters.isApply);
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
