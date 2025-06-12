/**
 * 客訴管理服務
 *
 * 處理客訴相關的業務邏輯
 * 連接 qms_voc_detail 資料表
 */

import databaseService from "../database.js";
import logger from "../../config/logger.js";

class ComplaintsService {
  constructor() {
    this.dbName = "qms";
    this.tableName = "qms_voc_detail";
  }

  /**
   * 取得客訴列表
   */
  async getComplaintsList(filters = {}) {
    try {
      let sql = `
        SELECT 
          id,
          voc_no,
          customer_name,
          complaint_type,
          complaint_category,
          complaint_subject,
          complaint_content,
          status,
          priority_level,
          created_date,
          updated_date,
          assigned_to,
          response_deadline
        FROM ${this.tableName}
        WHERE 1=1
      `;

      const params = [];

      // 狀態篩選
      if (filters.status) {
        sql += " AND status = ?";
        params.push(filters.status);
      }

      // 優先級篩選
      if (filters.priorityLevel) {
        sql += " AND priority_level = ?";
        params.push(filters.priorityLevel);
      }

      // 客訴類型篩選
      if (filters.complaintType) {
        sql += " AND complaint_type = ?";
        params.push(filters.complaintType);
      }

      // 負責人篩選
      if (filters.assignedTo) {
        sql += " AND assigned_to = ?";
        params.push(filters.assignedTo);
      }

      // 客戶名稱搜尋
      if (filters.customerName) {
        sql += " AND customer_name LIKE ?";
        params.push(`%${filters.customerName}%`);
      }

      // 日期範圍篩選
      if (filters.startDate) {
        sql += " AND created_date >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        sql += " AND created_date <= ?";
        params.push(filters.endDate);
      }

      // 排序
      sql += " ORDER BY created_date DESC";

      // 分頁
      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));

        if (filters.offset) {
          sql += " OFFSET ?";
          params.push(parseInt(filters.offset));
        }
      }

      const complaints = await databaseService.query(this.dbName, sql, params);

      logger.info("客訴列表查詢成功", {
        count: complaints.length,
        filters,
      });

      return complaints;
    } catch (error) {
      logger.error("客訴列表查詢失敗", {
        filters,
        error: error.message,
      });
      throw new Error(`查詢客訴列表失敗: ${error.message}`);
    }
  }

  /**
   * 根據 ID 取得客訴詳情
   */
  async getComplaintById(id) {
    try {
      const sql = `
        SELECT 
          id,
          voc_no,
          customer_name,
          customer_contact,
          complaint_type,
          complaint_category,
          complaint_subject,
          complaint_content,
          status,
          priority_level,
          created_date,
          updated_date,
          assigned_to,
          response_deadline,
          resolution_notes,
          resolution_date,
          customer_satisfaction
        FROM ${this.tableName}
        WHERE id = ?
      `;

      const complaints = await databaseService.query(this.dbName, sql, [id]);

      if (complaints.length === 0) {
        throw new Error(`找不到 ID 為 ${id} 的客訴記錄`);
      }

      logger.info("客訴詳情查詢成功", {
        id,
        vocNo: complaints[0].voc_no,
      });

      return complaints[0];
    } catch (error) {
      logger.error("客訴詳情查詢失敗", {
        id,
        error: error.message,
      });
      throw new Error(`查詢客訴詳情失敗: ${error.message}`);
    }
  }

  /**
   * 根據客訴編號取得客訴詳情
   */
  async getComplaintByVocNo(vocNo) {
    try {
      const sql = `
        SELECT 
          id,
          voc_no,
          customer_name,
          customer_contact,
          complaint_type,
          complaint_category,
          complaint_subject,
          complaint_content,
          status,
          priority_level,
          created_date,
          updated_date,
          assigned_to,
          response_deadline,
          resolution_notes,
          resolution_date,
          customer_satisfaction
        FROM ${this.tableName}
        WHERE voc_no = ?
      `;

      const complaints = await databaseService.query(this.dbName, sql, [vocNo]);

      if (complaints.length === 0) {
        throw new Error(`找不到編號為 ${vocNo} 的客訴記錄`);
      }

      logger.info("客訴詳情查詢成功", {
        vocNo,
        id: complaints[0].id,
      });

      return complaints[0];
    } catch (error) {
      logger.error("客訴詳情查詢失敗", {
        vocNo,
        error: error.message,
      });
      throw new Error(`查詢客訴詳情失敗: ${error.message}`);
    }
  }

  /**
   * 取得客訴統計資料
   */
  async getComplaintsStatistics(filters = {}) {
    try {
      let baseWhere = "WHERE 1=1";
      const params = [];

      // 日期範圍篩選
      if (filters.startDate) {
        baseWhere += " AND created_date >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        baseWhere += " AND created_date <= ?";
        params.push(filters.endDate);
      }

      // 統計查詢
      const statusSql = `
        SELECT 
          status,
          COUNT(*) as count
        FROM ${this.tableName}
        ${baseWhere}
        GROUP BY status
      `;

      const prioritySql = `
        SELECT 
          priority_level,
          COUNT(*) as count
        FROM ${this.tableName}
        ${baseWhere}
        GROUP BY priority_level
      `;

      const typeSql = `
        SELECT 
          complaint_type,
          COUNT(*) as count
        FROM ${this.tableName}
        ${baseWhere}
        GROUP BY complaint_type
      `;

      const [statusStats, priorityStats, typeStats] = await Promise.all([
        databaseService.query(this.dbName, statusSql, params),
        databaseService.query(this.dbName, prioritySql, params),
        databaseService.query(this.dbName, typeSql, params),
      ]);

      const statistics = {
        byStatus: statusStats,
        byPriority: priorityStats,
        byType: typeStats,
        generatedAt: new Date().toISOString(),
      };

      logger.info("客訴統計查詢成功", {
        filters,
        totalStatusItems: statusStats.length,
        totalPriorityItems: priorityStats.length,
        totalTypeItems: typeStats.length,
      });

      return statistics;
    } catch (error) {
      logger.error("客訴統計查詢失敗", {
        filters,
        error: error.message,
      });
      throw new Error(`查詢客訴統計失敗: ${error.message}`);
    }
  }

  /**
   * 更新客訴狀態
   */
  async updateComplaintStatus(id, status, notes = null) {
    try {
      let sql = `
        UPDATE ${this.tableName}
        SET status = ?, updated_date = NOW()
      `;
      const params = [status];

      if (notes) {
        sql += ", resolution_notes = ?";
        params.push(notes);
      }

      if (status === "已解決" || status === "已完成") {
        sql += ", resolution_date = NOW()";
      }

      sql += " WHERE id = ?";
      params.push(id);

      await databaseService.query(this.dbName, sql, params);

      logger.info("客訴狀態更新成功", {
        id,
        newStatus: status,
        hasNotes: !!notes,
      });

      return { success: true, message: "客訴狀態更新成功" };
    } catch (error) {
      logger.error("客訴狀態更新失敗", {
        id,
        status,
        error: error.message,
      });
      throw new Error(`更新客訴狀態失敗: ${error.message}`);
    }
  }
}

export default new ComplaintsService();
