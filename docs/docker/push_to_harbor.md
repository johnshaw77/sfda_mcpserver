# 1. 拉取官方映像檔
docker pull nginx:1.25-alpine

# 2. 打 Tag 給 Harbor
docker tag nginx:1.25-alpine 127.0.0.1:7001/library/nginx:1.25-alpine

# 3. 登入 Harbor（如已登入可省略）
docker login 127.0.0.1:7001

# 4. Push 到 Harbor
docker push 127.0.0.1:7001/library/nginx:1.25-alpine