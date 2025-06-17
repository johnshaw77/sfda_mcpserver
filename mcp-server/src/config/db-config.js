const dbConfig = {
  // 資料庫配置
  qms: {
    host: process.env.QMS_LOCAL_DB_HOST || "localhost",
    port: parseInt(process.env.QMS_LOCAL_DB_PORT) || 3306,
    user: process.env.QMS_LOCAL_DB_USER || "root",
    password: process.env.QMS_LOCAL_DB_PASSWORD || "MyPwd@1234",
    database: process.env.QMS_LOCAL_DB_NAME || "qsm",
    charset: "utf8mb4",
    timezone: "+08:00",
    connectionLimit: 10,
  },
  qmsremote: {
    host: process.env.QMS_DB_HOST || "10.1.5.184",
    port: parseInt(process.env.QMS_DB_PORT) || 3306,
    user: process.env.QMS_DB_USER || "qsuser",
    password: process.env.QMS_DB_PASSWORD || "1q2w3e4R",
    database: process.env.QMS_DB_NAME || "qsm",
    charset: "utf8mb4",
    timezone: "+08:00",
    connectionLimit: 10,
    // 移除 acquireTimeout - 改用 waitForConnections 和 queueLimit
  },
  iym: {
    host: "10.1.5.100",
    user: "flexium",
    password: "1qaz@WSX",
    port: 31022,
    database: "iym",
    charset: "utf8mb4",
    timezone: "+08:00",
    connectionLimit: 10,
    // 移除 acquireTimeout - 改用 waitForConnections 和 queueLimit
  },
  // MIL 資料庫設定
  mil: {
    host: process.env.MIL_DB_HOST || "OA-DB2012.flexium.com.cn",
    port: parseInt(process.env.MIL_DB_PORT) || 1433, // MSSQL 預設端口
    user: process.env.MIL_DB_USER || "kduser",
    password: process.env.MIL_DB_PASSWORD || "kduser.", // 注意密碼中有個句點
    database: process.env.MIL_DB_NAME || "flexiumoa",
    options: {
      encrypt: false, // 如果需要加密連線則設為 true
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
    },
    connectionLimit: 10,
  },
};

export default dbConfig;
