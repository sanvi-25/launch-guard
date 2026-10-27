@echo off
echo ========================================================
echo   Packaging LaunchGuard codebase into launchguard.zip
echo ========================================================
powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath ..\launchguard.zip -Force -CompressionLevel Optimal"
if exist "..\launchguard.zip" (
    echo.
    echo [SUCCESS] launchguard.zip created successfully on your Desktop!
    echo Location: %USERPROFILE%\Desktop\launchguard.zip
) else (
    echo [ERROR] Could not create zip. Please visit http://localhost:3000/api/download-zip in your browser.
)
echo.
pause
