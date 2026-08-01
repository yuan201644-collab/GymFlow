@echo off
chcp 65001 >nul
echo ==========================================
echo   GymFlow AI 一键启动（后端 + 固定隧道）
echo   AI 地址: https://ai.gym-flow.xyz
echo ==========================================
echo.
echo [1/2] 启动 AI 后端 (localhost:3000)...
start "GymFlow-AI-Backend" cmd /k "cd /d C:\Users\86133\Desktop\健身助手\server && node server.js"
timeout /t 2 /nobreak >nul
echo [2/2] 启动固定隧道 (ai.gym-flow.xyz)...
start "GymFlow-Tunnel" cmd /k "C:\Program Files (x86)\cloudflared\cloudflared.exe tunnel run gymflow"
echo.
echo 已全部启动！手机/网页 AI 地址均为: https://ai.gym-flow.xyz
echo 两个命令行窗口请保持打开（关闭即停止服务）。
pause
