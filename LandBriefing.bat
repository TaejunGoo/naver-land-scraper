@echo off
:: 한글 깨짐 방지를 위한 UTF-8 설정
chcp 65001 >nul
title 랜드브리핑(LandBriefing) 매니저
cd /d %~dp0

:: --- [추가] 선행 조건 체크 로직 ---
echo [0/4] 시스템 환경 확인 중...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [에러] Node.js가 설치되어 있지 않습니다!
    echo https://nodejs.org/ 에서 LTS 버전을 설치한 후 다시 실행해 주세요.
    pause
    exit
)
:: --------------------------------

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

echo 데이터베이스 상태 확인 중...
if not exist "prisma\dev.db" (
    echo [알림] DB 파일이 없습니다. 초기화를 시작합니다...
    call npx prisma db push --accept-data-loss
) else (
    echo.
    echo 알림 : DB 스키마 구조를 업데이트하시겠습니까?
    echo 변경 사항이 없다면 N을 눌러 건너뛰세요. 3초 후 자동 건너뜀
    choice /t 3 /d n /m "> DB를 업데이트하시겠습니까?"
    if errorlevel 2 (
        echo 진행 : 스키마 업데이트를 건너뜁니다.
    ) else (
        echo 진행 : DB 업데이트 중...
        call npx prisma db push --accept-data-loss
    )
)
call npx prisma generate
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
set APP_PORT=5500
echo 서버 주소: http://localhost:%APP_PORT%
echo DB 파일 위치: backend\prisma\dev.db
echo.

:: 서버 실행 (백그라운드)
:: PORT 환경변수를 지정하여 빌드 모드 포트를 분리합니다.
start /b cmd /c "cd backend && set PORT=%APP_PORT% && npm run dev"

:: 서버 준비 대기 (동적 polling - 실제 서버 응답 확인)
echo 서버가 준비될 때까지 대기 중...
set APP_PORT=%APP_PORT%
node wait-for-server.js
if %errorlevel% neq 0 (
    echo [경고] 서버 대기 시간 초과. 브라우저를 수동으로 열어주세요.
    pause
) else (
    :: 브라우저 실행
    start http://localhost:%APP_PORT%
)

echo.
echo ==========================================
echo    실행 완료! 이 창을 닫으면 종료됩니다.
echo ==========================================
pause
