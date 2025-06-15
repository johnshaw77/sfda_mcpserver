// 獲取 qmslocal 資料庫中所有表格的結構信息
// 並將結果輸出為整合的 Markdown 文件（所有表格在一個文件中）
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// 獲取當前文件的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 手動導入資料庫配置，因為可能有相對路徑問題
const dbConfig = {
  qmslocal: {
    host: process.env.QMS_LOCAL_DB_HOST || "localhost",
    port: parseInt(process.env.QMS_LOCAL_DB_PORT) || 3306,
    user: process.env.QMS_LOCAL_DB_USER || "root",
    password: process.env.QMS_LOCAL_DB_PASSWORD || "MyPwd@1234",
    database: process.env.QMS_LOCAL_DB_NAME || "qsm",
    charset: "utf8mb4",
    timezone: "+08:00",
    connectionLimit: 10,
  },
};

async function getTableSchema() {
  // 建立連接
  const connection = await mysql.createConnection({
    host: dbConfig.qmslocal.host,
    port: dbConfig.qmslocal.port,
    user: dbConfig.qmslocal.user,
    password: dbConfig.qmslocal.password,
    database: dbConfig.qmslocal.database,
  });

  try {
    console.log("連接到資料庫...");

    // 獲取所有表格名稱
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [dbConfig.qmslocal.database],
    );

    console.log(`找到 ${tables.length} 個表格`);

    // 創建整合的 Markdown 文件內容
    const allTablesContent = [
      `# ${dbConfig.qmslocal.database} 資料庫所有表格結構\n\n`,
    ];
    allTablesContent.push(`資料庫名稱: **${dbConfig.qmslocal.database}**\n`);
    allTablesContent.push(
      `主機: ${dbConfig.qmslocal.host}:${dbConfig.qmslocal.port}\n`,
    );
    allTablesContent.push(
      `產生時間: ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n\n`,
    );
    allTablesContent.push(`## 目錄\n\n`);

    // 創建 SQL 命令文件內容
    const allSqlContent = [
      `# ${dbConfig.qmslocal.database} 資料庫所有表格建立 SQL\n\n`,
    ];
    allSqlContent.push(`資料庫名稱: **${dbConfig.qmslocal.database}**\n`);
    allSqlContent.push(
      `主機: ${dbConfig.qmslocal.host}:${dbConfig.qmslocal.port}\n`,
    );
    allSqlContent.push(
      `產生時間: ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n\n`,
    );

    // 添加目錄項
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i].TABLE_NAME;
      allTablesContent.push(`${i + 1}. [${tableName}](#表格-${tableName})\n`);
    }

    allTablesContent.push(`\n---\n`);

    // 為每個表格生成內容
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i].TABLE_NAME;
      console.log(`處理表格: ${tableName}`);

      // 獲取表格結構
      const [columns] = await connection.query(
        `SHOW FULL COLUMNS FROM \`${tableName}\``,
      );

      // 獲取表格索引
      const [indexes] = await connection.query(
        `SHOW INDEX FROM \`${tableName}\``,
      );

      // 獲取表格建立語句
      const [createTable] = await connection.query(
        `SHOW CREATE TABLE \`${tableName}\``,
      );

      // 添加表格信息到整合的 Markdown 文件
      allTablesContent.push(`\n## 表格: ${tableName}\n\n`);

      allTablesContent.push(`### 表格結構\n\n`);
      allTablesContent.push(
        `| 欄位名稱 | 資料型別 | 可為空 | 索引 | 預設值 | 備註 |\n`,
      );
      allTablesContent.push(
        `| -------- | -------- | ------ | ---- | ------ | ---- |\n`,
      );

      for (const column of columns) {
        const nullable = column.Null === "YES" ? "是" : "否";
        const key = column.Key ? column.Key : "";
        const defaultValue = column.Default !== null ? column.Default : "";
        const comment = column.Comment || "";

        allTablesContent.push(
          `| ${column.Field} | ${column.Type} | ${nullable} | ${key} | ${defaultValue} | ${comment} |\n`,
        );
      }

      allTablesContent.push(`\n### 索引信息\n\n`);

      if (indexes.length > 0) {
        allTablesContent.push(`| 索引名稱 | 欄位 | 唯一 | 類型 |\n`);
        allTablesContent.push(`| -------- | ---- | ---- | ---- |\n`);

        const indexMap = {};

        for (const index of indexes) {
          if (!indexMap[index.Key_name]) {
            indexMap[index.Key_name] = {
              name: index.Key_name,
              columns: [],
              unique: index.Non_unique === 0 ? "是" : "否",
              type: index.Index_type,
            };
          }

          indexMap[index.Key_name].columns.push(index.Column_name);
        }

        for (const key in indexMap) {
          const index = indexMap[key];
          allTablesContent.push(
            `| ${index.name} | ${index.columns.join(", ")} | ${index.unique} | ${index.type} |\n`,
          );
        }
      } else {
        allTablesContent.push(`此表格沒有索引\n`);
      }

      // 添加建立表格 SQL 到 SQL 文件
      allSqlContent.push(`## 表格: ${tableName}\n\n`);
      allSqlContent.push("```sql\n");
      allSqlContent.push(createTable[0]["Create Table"]);
      allSqlContent.push("\n```\n\n");
    }

    const outputDir = path.resolve(__dirname, "..", "docs", "qmsdb");

    // 確保輸出目錄存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 寫入整合的 Markdown 文件
    fs.writeFileSync(
      path.join(outputDir, "all_tables.md"),
      allTablesContent.join(""),
    );

    // 寫入 SQL 命令文件
    fs.writeFileSync(
      path.join(outputDir, "all_sql.md"),
      allSqlContent.join(""),
    );

    // 更新 README.md 文件
    const readmeContent = [
      `# ${dbConfig.qmslocal.database} 資料庫結構總覽\n\n`,
    ];
    readmeContent.push(`資料庫名稱: **${dbConfig.qmslocal.database}**\n`);
    readmeContent.push(
      `主機: ${dbConfig.qmslocal.host}:${dbConfig.qmslocal.port}\n`,
    );
    readmeContent.push(
      `產生時間: ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n\n`,
    );
    readmeContent.push(`## 文檔內容\n\n`);
    readmeContent.push(
      `- [所有表格結構](all_tables.md) - 包含所有表格的欄位、索引等信息\n`,
    );
    readmeContent.push(
      `- [所有表格 SQL](all_sql.md) - 包含所有表格的建立 SQL 命令\n`,
    );
    readmeContent.push(
      `- [使用指南](usage-guide.md) - 說明如何使用這些文檔\n\n`,
    );
    readmeContent.push(`## 表格總數\n\n`);
    readmeContent.push(`資料庫共有 **${tables.length}** 個表格。\n`);

    fs.writeFileSync(path.join(outputDir, "README.md"), readmeContent.join(""));

    console.log("完成! 結構資訊已輸出到 docs/qmsdb 目錄");
    console.log(`- all_tables.md: 包含所有表格結構`);
    console.log(`- all_sql.md: 包含所有表格的建立 SQL 命令`);
    console.log(`- README.md: 已更新`);
  } catch (error) {
    console.error("獲取資料庫結構時發生錯誤:", error);
  } finally {
    await connection.end();
  }
}

// 執行主函數
getTableSchema();
