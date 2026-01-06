@echo off
:: 한글 깨짐 방지를 위한 UTF-8 설정
chcp 65001 >nul
title 랜드브리핑(LandBriefing) 매니저
cd /d %~dp0

echo ==========================================
echo    랜드브리핑(LandBriefing) 시작 중...
echo ==========================================

:: 1. 백엔드 초기화 체크
echo [1/4] 백엔드 설정 확인 중...
cd backend
if not exist "node_modules" (
    echo 라이브러리가 없습니다. 설치를 시작합니다...
    call npm install
)
if not exist "prisma\dev.db" (
    echo 데이터베이스를 초기화합니다...
    call npx prisma migrate dev --name init
)
cd ..

:: 2. 프런트엔드 초기화 체크
echo [2/4] 프런트엔드 설정 확인 중...
cd frontend
if not exist "node_modules" (
    echo 라이브러리가 없습니다. 설치를 시작합니다...
    call npm install
)

:: 3. 프런트엔드 빌드 (소스 변경 감지 로직)
:: 주의: 괄호 안의 echo 메시지에 괄호를 쓰지 마세요.
echo [3/4] 화면 빌드 상태를 확인합니다...
if exist "dist" (
    echo.
    echo 알림 : 소스 코드 - TSX, CSS 등 - 에 변경 사항이 있습니까?
    echo Y를 누르면 다시 빌드하고, 3초간 입력이 없으면 기존 화면을 유지합니다.
    echo.
    choice /t 3 /d n /m "> 다시 빌드하시겠습니까?"
    if errorlevel 2 (
        echo 진행 : 기존 빌드 파일을 사용하여 실행합니다.
    ) else (
        echo 진행 : 최신 소스로 다시 빌드 중입니다... 잠시만 기다려 주세요.
        call npm run build
    )
) else (
    echo 진행 : 빌드 파일이 없습니다. 최초 빌드를 시작합니다...
    call npm run build
)
cd ..

:: 4. 통합 서버 실행 및 브라우저 오픈
echo.
echo [4/4] 서버를 실행하고 브라우저를 엽니다...
echo.
echo 서버 주소: http://localhost:5000
echo DB 파일 위치: backend\prisma\dev.db
echo.

:: 서버 실행 (백그라운드)
start /b cmd /c "cd backend && npm run dev"

:: 브라우저 대기 및 실행
timeout /t 5 >nul
start http://localhost:5000

echo.
echo ==========================================
echo    실행 완료! 이 창을 닫으면 종료됩니다.
echo ==========================================
pause
