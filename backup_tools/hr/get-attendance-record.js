/**
 * 員工出勤查詢工具
 *
 * 提供員工出勤記錄、加班、請假等查詢功能
 */

import { BaseTool } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import logger from "../../config/logger.js";

export class GetAttendanceRecordTool extends BaseTool {
  constructor() {
    super("get_attendance_record", "查詢員工出勤記錄", {
      type: "object",
      properties: {
        employeeNo: {
          type: "string",
          pattern: "^[A-Z]\\d{6}$",
          description:
            "員工編號（格式：A123456），對應資料庫中的 employee_no 欄位",
        },
        startDate: {
          type: "string",
          format: "date",
          description: "查詢起始日期（YYYY-MM-DD）",
        },
        endDate: {
          type: "string",
          format: "date",
          description: "查詢結束日期（YYYY-MM-DD）",
        },
        recordType: {
          type: "string",
          enum: ["all", "attendance", "overtime", "leave"],
          default: "all",
          description:
            "記錄類型：all(全部)、attendance(出勤)、overtime(加班)、leave(請假)",
        },
        includeDetails: {
          type: "boolean",
          default: true,
          description: "是否包含詳細資訊（打卡時間、地點等）",
        },
      },
      required: ["employeeNo", "startDate", "endDate"],
    });
  }

  async _execute(params) {
    const {
      employeeNo,
      startDate,
      endDate,
      recordType = "all",
      includeDetails = true,
    } = params;

    // 驗證員工編號格式
    if (!this._validateEmployeeNo(employeeNo)) {
      throw new Error("員工編號格式錯誤，應為 A123456 格式");
    }

    // 驗證日期範圍
    if (!this._validateDateRange(startDate, endDate)) {
      throw new Error("日期範圍錯誤，結束日期不能早於開始日期");
    }

    logger.info("Querying attendance record", {
      toolName: this.name,
      employeeNo,
      startDate,
      endDate,
      recordType,
      includeDetails,
    });

    try {
      // 模擬 API 調用（實際環境中會調用真實的考勤系統 API）
      const response = await this._simulateAttendanceQuery(
        employeeNo,
        startDate,
        endDate,
        recordType,
        includeDetails,
      );

      logger.info("Attendance record retrieved successfully", {
        toolName: this.name,
        employeeNo,
        recordCount: response.records.length,
        period: `${startDate} to ${endDate}`,
      });

      return {
        success: true,
        result: {
          employeeNo,
          period: {
            startDate,
            endDate,
          },
          recordType,
          includeDetails,
          timestamp: new Date().toISOString(),
          ...response,
        },
      };
    } catch (error) {
      logger.error("Failed to retrieve attendance record", {
        toolName: this.name,
        error: error.message,
        employeeId,
        startDate,
        endDate,
      });

      throw new Error(`查詢出勤記錄失敗: ${error.message}`);
    }
  }

  /**
   * 驗證員工編號格式
   */
  _validateEmployeeNo(employeeNo) {
    const pattern = /^[A-Z]\d{6}$/;
    return pattern.test(employeeNo);
  }

  /**
   * 驗證日期範圍
   */
  _validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }

  /**
   * 模擬出勤記錄查詢 API
   */
  async _simulateAttendanceQuery(
    employeeNo,
    startDate,
    endDate,
    recordType,
    includeDetails,
  ) {
    // 模擬延遲
    await new Promise(resolve =>
      setTimeout(resolve, 150 + Math.random() * 300),
    );

    // 檢查員工是否存在
    if (!this._isValidEmployee(employeeId)) {
      throw new Error(`員工編號 ${employeeId} 不存在`);
    }

    // 生成模擬出勤記錄
    const records = this._generateAttendanceRecords(
      employeeId,
      startDate,
      endDate,
      recordType,
      includeDetails,
    );

    // 計算統計資料
    const statistics = this._calculateStatistics(records);

    return {
      records,
      statistics,
      summary: this._generateSummary(records, startDate, endDate),
    };
  }

  /**
   * 檢查員工是否存在
   */
  _isValidEmployee(employeeId) {
    const validEmployees = ["A123456", "A123457", "A123458", "A123459"];
    return validEmployees.includes(employeeId);
  }

  /**
   * 生成出勤記錄
   */
  _generateAttendanceRecords(
    employeeId,
    startDate,
    endDate,
    recordType,
    includeDetails,
  ) {
    const records = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();

      // 跳過週末（除非有加班記錄）
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // 20% 機率有週末加班
        if (
          Math.random() < 0.2 &&
          (recordType === "all" || recordType === "overtime")
        ) {
          records.push(this._createOvertimeRecord(dateStr, includeDetails));
        }
        continue;
      }

      // 工作日記錄
      const record = this._createWorkdayRecord(
        dateStr,
        recordType,
        includeDetails,
      );
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * 建立工作日記錄
   */
  _createWorkdayRecord(date, recordType, includeDetails) {
    const baseRecord = {
      date,
      dayOfWeek: new Date(date).toLocaleDateString("zh-TW", {
        weekday: "long",
      }),
    };

    // 10% 機率請假
    if (
      Math.random() < 0.1 &&
      (recordType === "all" || recordType === "leave")
    ) {
      return {
        ...baseRecord,
        type: "leave",
        status: "請假",
        leaveType: ["事假", "病假", "特休"][Math.floor(Math.random() * 3)],
        hours: 8,
        ...(includeDetails && {
          details: {
            reason: "個人事務",
            approver: "王主管",
            approvedAt: new Date(date + "T10:00:00").toISOString(),
          },
        }),
      };
    }

    // 正常出勤記錄
    if (recordType === "all" || recordType === "attendance") {
      const checkInTime = this._generateRandomTime(8, 9); // 8-9點之間
      const checkOutTime = this._generateRandomTime(17, 19); // 17-19點之間

      return {
        ...baseRecord,
        type: "attendance",
        status: "正常出勤",
        checkIn: {
          time: `${date}T${checkInTime}:00.000Z`,
          location: "台北總部",
          method: "卡片打卡",
        },
        checkOut: {
          time: `${date}T${checkOutTime}:00.000Z`,
          location: "台北總部",
          method: "卡片打卡",
        },
        workHours: this._calculateWorkHours(checkInTime, checkOutTime),
        ...(includeDetails && {
          details: {
            overtime:
              Math.random() < 0.3 ? this._generateRandomTime(1, 3) : null,
            breaks: [{ type: "午休", start: "12:00", end: "13:00" }],
          },
        }),
      };
    }

    return null;
  }

  /**
   * 建立加班記錄
   */
  _createOvertimeRecord(date, includeDetails) {
    const startTime = this._generateRandomTime(19, 20);
    const endTime = this._generateRandomTime(21, 23);

    return {
      date,
      dayOfWeek: new Date(date).toLocaleDateString("zh-TW", {
        weekday: "long",
      }),
      type: "overtime",
      status: "加班",
      startTime: `${date}T${startTime}:00.000Z`,
      endTime: `${date}T${endTime}:00.000Z`,
      hours: this._calculateWorkHours(startTime, endTime),
      ...(includeDetails && {
        details: {
          reason: "專案趕工",
          approver: "王主管",
          approvedAt: new Date(date + "T18:00:00").toISOString(),
          compensationType: "加班費",
        },
      }),
    };
  }

  /**
   * 生成隨機時間
   */
  _generateRandomTime(startHour, endHour) {
    const hour =
      startHour + Math.floor(Math.random() * (endHour - startHour + 1));
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  /**
   * 計算工作時數
   */
  _calculateWorkHours(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }

  /**
   * 計算統計資料
   */
  _calculateStatistics(records) {
    const stats = {
      totalDays: records.length,
      workDays: records.filter(r => r.type === "attendance").length,
      leaveDays: records.filter(r => r.type === "leave").length,
      overtimeDays: records.filter(r => r.type === "overtime").length,
      totalWorkHours: 0,
      totalOvertimeHours: 0,
    };

    records.forEach(record => {
      if (record.type === "attendance" && record.workHours) {
        stats.totalWorkHours += record.workHours;
      }
      if (record.type === "overtime" && record.hours) {
        stats.totalOvertimeHours += record.hours;
      }
    });

    return stats;
  }

  /**
   * 生成摘要
   */
  _generateSummary(records, startDate, endDate) {
    const stats = this._calculateStatistics(records);

    return {
      period: `${startDate} 至 ${endDate}`,
      attendanceRate:
        records.length > 0
          ? `${Math.round((stats.workDays / stats.totalDays) * 100)}%`
          : "0%",
      averageWorkHours:
        stats.workDays > 0
          ? Math.round((stats.totalWorkHours / stats.workDays) * 10) / 10
          : 0,
      totalOvertimeHours: stats.totalOvertimeHours,
    };
  }
}
