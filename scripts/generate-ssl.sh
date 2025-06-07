#!/bin/bash

# 生成演示用自簽 SSL 證書腳本

set -e

CERT_DIR="/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/nginx/ssl"
DOMAIN="localhost"
DAYS=365

echo "📜 生成演示用 SSL 證書..."

# 建立證書目錄
mkdir -p "$CERT_DIR"

# 生成私鑰
echo "🔑 生成私鑰..."
openssl genrsa -out "$CERT_DIR/demo.key" 2048

# 生成證書簽名請求
echo "📝 生成證書簽名請求..."
openssl req -new -key "$CERT_DIR/demo.key" -out "$CERT_DIR/demo.csr" -subj "/C=TW/ST=Taipei/L=Taipei/O=Demo Company/OU=IT Department/CN=$DOMAIN"

# 生成自簽證書
echo "🏆 生成自簽證書..."
openssl x509 -req -in "$CERT_DIR/demo.csr" -signkey "$CERT_DIR/demo.key" -out "$CERT_DIR/demo.crt" -days $DAYS

# 設定權限
chmod 600 "$CERT_DIR/demo.key"
chmod 644 "$CERT_DIR/demo.crt"

# 清理暫存檔案
rm "$CERT_DIR/demo.csr"

echo "✅ SSL 證書生成完成！"
echo "📁 證書位置: $CERT_DIR"
echo "🔒 私鑰: demo.key"
echo "📜 證書: demo.crt"
echo "⏰ 有效期: $DAYS 天"

# 顯示證書資訊
echo ""
echo "📋 證書資訊:"
openssl x509 -in "$CERT_DIR/demo.crt" -text -noout | head -20
