/**
 * 員工資料服務（兼容導入）
 *
 * 為了支持現有代碼的向後兼容，從 hr 目錄導入服務
 *
 * 新代碼應直接使用 services/hr/employee-service.js
 */

import employeeService from "./hr/employee-service.js";
export default employeeService;
