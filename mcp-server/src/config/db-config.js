const dbConfig = {
  // 資料庫配置

  qms: {
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
};

export default dbConfig;
