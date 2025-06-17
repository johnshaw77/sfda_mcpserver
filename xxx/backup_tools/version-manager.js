/**
 * 工具版本管理系統
 *
 * 管理工具的版本控制、相容性和升級路徑
 */

import logger from "../config/logger.js";

/**
 * 版本比較結果
 */
export const VersionComparison = {
  MAJOR: "major",
  MINOR: "minor",
  PATCH: "patch",
  EQUAL: "equal",
  INVALID: "invalid",
};

/**
 * 工具版本類別
 */
export class ToolVersion {
  constructor(version) {
    if (typeof version === "string") {
      this.parseVersion(version);
    } else if (typeof version === "object") {
      this.major = version.major || 1;
      this.minor = version.minor || 0;
      this.patch = version.patch || 0;
      this.preRelease = version.preRelease || null;
      this.buildMetadata = version.buildMetadata || null;
    } else {
      throw new Error("Invalid version format");
    }
  }

  /**
   * 解析版本字串 (Semantic Versioning)
   */
  parseVersion(versionString) {
    const semverRegex =
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    const match = versionString.match(semverRegex);

    if (!match) {
      throw new Error(`Invalid semantic version: ${versionString}`);
    }

    this.major = parseInt(match[1], 10);
    this.minor = parseInt(match[2], 10);
    this.patch = parseInt(match[3], 10);
    this.preRelease = match[4] || null;
    this.buildMetadata = match[5] || null;
  }

  /**
   * 轉換為字串
   */
  toString() {
    let version = `${this.major}.${this.minor}.${this.patch}`;

    if (this.preRelease) {
      version += `-${this.preRelease}`;
    }

    if (this.buildMetadata) {
      version += `+${this.buildMetadata}`;
    }

    return version;
  }

  /**
   * 比較兩個版本
   */
  compareTo(other) {
    if (!(other instanceof ToolVersion)) {
      other = new ToolVersion(other);
    }

    // 比較主版本號
    if (this.major !== other.major) {
      return this.major > other.major ? 1 : -1;
    }

    // 比較次版本號
    if (this.minor !== other.minor) {
      return this.minor > other.minor ? 1 : -1;
    }

    // 比較修訂版本號
    if (this.patch !== other.patch) {
      return this.patch > other.patch ? 1 : -1;
    }

    // 比較預發布版本
    if (this.preRelease && other.preRelease) {
      return this.preRelease.localeCompare(other.preRelease);
    } else if (this.preRelease) {
      return -1; // 有預發布版本的比沒有的小
    } else if (other.preRelease) {
      return 1;
    }

    return 0; // 相等
  }

  /**
   * 檢查是否相容
   */
  isCompatibleWith(other) {
    if (!(other instanceof ToolVersion)) {
      other = new ToolVersion(other);
    }

    // 主版本號不同則不相容
    if (this.major !== other.major) {
      return false;
    }

    // 次版本號向後相容
    return this.minor >= other.minor;
  }

  /**
   * 獲取版本差異類型
   */
  getDifferenceType(other) {
    if (!(other instanceof ToolVersion)) {
      other = new ToolVersion(other);
    }

    const comparison = this.compareTo(other);

    if (comparison === 0) {
      return VersionComparison.EQUAL;
    }

    if (this.major !== other.major) {
      return VersionComparison.MAJOR;
    }

    if (this.minor !== other.minor) {
      return VersionComparison.MINOR;
    }

    if (this.patch !== other.patch) {
      return VersionComparison.PATCH;
    }

    return VersionComparison.EQUAL;
  }

  /**
   * 創建下一個版本
   */
  increment(type = "patch") {
    const newVersion = {
      major: this.major,
      minor: this.minor,
      patch: this.patch,
      preRelease: null,
      buildMetadata: null,
    };

    switch (type) {
      case "major":
        newVersion.major++;
        newVersion.minor = 0;
        newVersion.patch = 0;
        break;
      case "minor":
        newVersion.minor++;
        newVersion.patch = 0;
        break;
      case "patch":
        newVersion.patch++;
        break;
      default:
        throw new Error(`Invalid increment type: ${type}`);
    }

    return new ToolVersion(newVersion);
  }
}

/**
 * 工具版本管理器
 */
export class VersionManager {
  constructor() {
    this.toolVersions = new Map(); // toolName -> ToolVersion
    this.versionHistory = new Map(); // toolName -> Array<VersionRecord>
    this.deprecatedVersions = new Map(); // toolName -> Array<ToolVersion>
    this.migrationPaths = new Map(); // toolName -> Map<fromVersion, migrationFn>
  }

  /**
   * 註冊工具版本
   */
  registerToolVersion(toolName, version, metadata = {}) {
    const toolVersion = new ToolVersion(version);

    // 記錄版本歷史
    if (!this.versionHistory.has(toolName)) {
      this.versionHistory.set(toolName, []);
    }

    const versionRecord = {
      version: toolVersion,
      registeredAt: new Date(),
      metadata: { ...metadata },
      isActive: true,
    };

    // 將舊版本標記為非活躍
    const history = this.versionHistory.get(toolName);
    history.forEach(record => (record.isActive = false));
    history.push(versionRecord);

    // 更新當前版本
    this.toolVersions.set(toolName, toolVersion);

    logger.info(
      `Tool version registered: ${toolName} v${toolVersion.toString()}`,
      {
        toolName,
        version: toolVersion.toString(),
        metadata,
      },
    );

    return toolVersion;
  }

  /**
   * 獲取工具當前版本
   */
  getToolVersion(toolName) {
    return this.toolVersions.get(toolName);
  }

  /**
   * 獲取工具版本歷史
   */
  getVersionHistory(toolName) {
    return this.versionHistory.get(toolName) || [];
  }

  /**
   * 檢查版本相容性
   */
  checkCompatibility(toolName, requiredVersion) {
    const currentVersion = this.getToolVersion(toolName);

    if (!currentVersion) {
      return {
        compatible: false,
        reason: "Tool not found",
        current: null,
        required: requiredVersion,
      };
    }

    const required = new ToolVersion(requiredVersion);
    const compatible = currentVersion.isCompatibleWith(required);

    return {
      compatible,
      reason: compatible ? "Compatible" : "Version mismatch",
      current: currentVersion.toString(),
      required: required.toString(),
      differenceType: currentVersion.getDifferenceType(required),
    };
  }

  /**
   * 標記版本為已棄用
   */
  deprecateVersion(toolName, version, deprecationInfo = {}) {
    const toolVersion = new ToolVersion(version);

    if (!this.deprecatedVersions.has(toolName)) {
      this.deprecatedVersions.set(toolName, []);
    }

    const deprecationRecord = {
      version: toolVersion,
      deprecatedAt: new Date(),
      reason: deprecationInfo.reason || "Version deprecated",
      migrationGuide: deprecationInfo.migrationGuide || null,
      supportEndDate: deprecationInfo.supportEndDate || null,
    };

    this.deprecatedVersions.get(toolName).push(deprecationRecord);

    logger.warn(
      `Tool version deprecated: ${toolName} v${toolVersion.toString()}`,
      {
        toolName,
        version: toolVersion.toString(),
        reason: deprecationRecord.reason,
      },
    );
  }

  /**
   * 檢查版本是否已棄用
   */
  isVersionDeprecated(toolName, version) {
    const deprecated = this.deprecatedVersions.get(toolName);
    if (!deprecated) return false;

    const checkVersion = new ToolVersion(version);
    return deprecated.some(
      record => record.version.compareTo(checkVersion) === 0,
    );
  }

  /**
   * 註冊版本遷移路徑
   */
  registerMigrationPath(toolName, fromVersion, toVersion, migrationFn) {
    if (!this.migrationPaths.has(toolName)) {
      this.migrationPaths.set(toolName, new Map());
    }

    const fromVer = new ToolVersion(fromVersion);
    const toVer = new ToolVersion(toVersion);
    const migrationKey = fromVer.toString();

    this.migrationPaths.get(toolName).set(migrationKey, {
      from: fromVer,
      to: toVer,
      migrationFn,
      registeredAt: new Date(),
    });

    logger.info(
      `Migration path registered: ${toolName} ${fromVer.toString()} -> ${toVer.toString()}`,
    );
  }

  /**
   * 執行版本遷移
   */
  async migrateData(toolName, fromVersion, data) {
    const migrations = this.migrationPaths.get(toolName);
    if (!migrations) {
      throw new Error(`No migration paths found for tool: ${toolName}`);
    }

    const fromVer = new ToolVersion(fromVersion);
    const migrationPath = migrations.get(fromVer.toString());

    if (!migrationPath) {
      throw new Error(
        `No migration path from version ${fromVer.toString()} for tool: ${toolName}`,
      );
    }

    try {
      const migratedData = await migrationPath.migrationFn(data);

      logger.info(
        `Data migrated: ${toolName} ${fromVer.toString()} -> ${migrationPath.to.toString()}`,
      );

      return {
        success: true,
        data: migratedData,
        fromVersion: fromVer.toString(),
        toVersion: migrationPath.to.toString(),
      };
    } catch (error) {
      logger.error(`Migration failed: ${toolName}`, {
        fromVersion: fromVer.toString(),
        toVersion: migrationPath.to.toString(),
        error: error.message,
      });

      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  /**
   * 獲取版本管理統計
   */
  getVersionStats() {
    const stats = {
      totalTools: this.toolVersions.size,
      totalVersions: 0,
      deprecatedVersions: 0,
      migrationPaths: 0,
      tools: {},
    };

    for (const [toolName, currentVersion] of this.toolVersions) {
      const history = this.getVersionHistory(toolName);
      const deprecated = this.deprecatedVersions.get(toolName) || [];
      const migrations = this.migrationPaths.get(toolName) || new Map();

      stats.totalVersions += history.length;
      stats.deprecatedVersions += deprecated.length;
      stats.migrationPaths += migrations.size;

      stats.tools[toolName] = {
        currentVersion: currentVersion.toString(),
        totalVersions: history.length,
        deprecatedVersions: deprecated.length,
        migrationPaths: migrations.size,
        firstVersion: history.length > 0 ? history[0].version.toString() : null,
        lastUpdated:
          history.length > 0 ? history[history.length - 1].registeredAt : null,
      };
    }

    return stats;
  }

  /**
   * 清理舊版本資料
   */
  cleanupOldVersions(toolName, keepVersions = 5) {
    const history = this.versionHistory.get(toolName);
    if (!history || history.length <= keepVersions) {
      return 0;
    }

    // 按註冊時間排序，保留最新的版本
    history.sort((a, b) => b.registeredAt - a.registeredAt);
    const toRemove = history.splice(keepVersions);

    logger.info(`Cleaned up old versions for tool: ${toolName}`, {
      toolName,
      removedVersions: toRemove.length,
      keptVersions: history.length,
    });

    return toRemove.length;
  }
}

// 全域版本管理器實例
export const globalVersionManager = new VersionManager();
