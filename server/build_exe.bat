@echo off
echo Building Client (Frontend)...
cd ../client
call npm run build
if %errorlevel% neq 0 (
    echo Client build failed!
    pause
    exit /b %errorlevel%
)
cd ../server

call .\venv\Scripts\activate
echo Building FastAccounting.exe...
set "ICON_PARAM="
if exist "app.ico" (
    echo Found custom icon: app.ico
    set "ICON_PARAM=--icon=app.ico"
) else (
    echo No custom icon found ^(app.ico^). Using default.
)

pyinstaller --clean --noconfirm --noconsole --onefile --name FastAccounting --add-data "../client/dist;client/dist" --add-data "fonts;fonts" --version-file=version_info.txt %ICON_PARAM% desktop_launcher.py
echo Copying .env file...
copy .env dist\.env
echo Build Complete!
pause
