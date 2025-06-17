/**
 * 模組元數據註冊機制
 *
 * 提供集中式的模組註冊與管理功能
 */

// 用於存儲所有模組的元數據
const moduleRegistry = {};

/**
 * 註冊模組元數據
 * @param {string} moduleId - 模組ID
 * @param {object} metadata - 模組元數據
 */
export function registerModuleMetadata(moduleId, metadata) {
  moduleRegistry[moduleId] = {
    ...metadata,
    id: moduleId,
    endpoint: metadata.endpoint || `/api/${moduleId}`,
  };
}

/**
 * 獲取特定模組的元數據
 * @param {string} moduleId - 模組ID
 * @returns {object|null} 模組元數據或null
 */
export function getModuleMetadata(moduleId) {
  return moduleRegistry[moduleId] || null;
}

/**
 * 獲取所有模組的元數據
 * @returns {object} 包含所有模組元數據的物件
 */
export function getAllModuleMetadata() {
  return { ...moduleRegistry };
}

/**
 * 驗證模組元數據
 * @param {object} metadata - 模組元數據
 * @returns {boolean} 是否合法
 */
export function validateModuleMetadata(metadata) {
  // 基本驗證：確保必要字段存在
  if (!metadata.name || !metadata.description) {
    return false;
  }
  return true;
}

export default {
  registerModuleMetadata,
  getModuleMetadata,
  getAllModuleMetadata,
  validateModuleMetadata,
};
