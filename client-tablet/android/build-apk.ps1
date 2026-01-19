# Script to build APK release for Fast Accounting
# Usage: .\build-apk.ps1

param(
    [switch]$Clean = $false,
    [switch]$SkipKeystore = $false
)

$ErrorActionPreference = "Stop"

# Paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$androidDir = $scriptDir
$appDir = Join-Path $androidDir "app"
$keystoreFile = Join-Path $appDir "fastaccounting-release.keystore"
$keystoreProps = Join-Path $appDir "keystore.properties"
$gradlew = Join-Path $androidDir "gradlew.bat"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build APK Release - Fast Accounting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Gradle wrapper
if (-not (Test-Path $gradlew)) {
    Write-Host "ERROR: Cannot find gradlew.bat at: $gradlew" -ForegroundColor Red
    exit 1
}

# Check and create keystore if needed
if (-not $SkipKeystore) {
    if (-not (Test-Path $keystoreFile)) {
        Write-Host "Keystore does not exist. Creating keystore..." -ForegroundColor Yellow
        
        $createKeystoreScript = Join-Path $appDir "create-keystore.ps1"
        if (Test-Path $createKeystoreScript) {
            & powershell -ExecutionPolicy Bypass -File $createKeystoreScript
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERROR: Failed to create keystore" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "ERROR: Cannot find keystore creation script: $createKeystoreScript" -ForegroundColor Red
            exit 1
        }
        Write-Host ""
    } else {
        Write-Host "Keystore already exists: $keystoreFile" -ForegroundColor Green
    }
    
    # Check keystore.properties
    if (-not (Test-Path $keystoreProps)) {
        Write-Host "WARNING: Cannot find keystore.properties. Creating default file..." -ForegroundColor Yellow
        @"
storePassword=fastaccounting123
keyPassword=fastaccounting123
keyAlias=fastaccounting
storeFile=fastaccounting-release.keystore
"@ | Out-File -FilePath $keystoreProps -Encoding UTF8
        Write-Host "Created keystore.properties" -ForegroundColor Green
    }
} else {
    Write-Host "Skipping keystore check (--SkipKeystore)" -ForegroundColor Yellow
}

Write-Host ""

# Remove JAVA_HOME if there is an issue
if ($env:JAVA_HOME) {
    $javaHomePath = $env:JAVA_HOME
    if (-not (Test-Path "$javaHomePath\bin\java.exe")) {
        Write-Host "JAVA_HOME is invalid. Removing environment variable..." -ForegroundColor Yellow
        Remove-Item Env:\JAVA_HOME -ErrorAction SilentlyContinue
    }
}

# Build APK
Write-Host "Building APK release..." -ForegroundColor Cyan
Write-Host ""

$buildArgs = @()
if ($Clean) {
    $buildArgs += "clean"
    Write-Host "Will clean before building" -ForegroundColor Yellow
}
$buildArgs += "assembleRelease"

$buildCommand = "& `"$gradlew`" $($buildArgs -join ' ')"
Write-Host "Command: $buildCommand" -ForegroundColor Gray
Write-Host ""

Push-Location $androidDir
try {
    Remove-Item Env:\JAVA_HOME -ErrorAction SilentlyContinue
    Invoke-Expression $buildCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Find and display APK information
$apkPath = Join-Path $appDir "build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkFile = Get-Item $apkPath
    $apkSizeMB = [math]::Round($apkFile.Length / 1MB, 2)
    
    Write-Host "APK Information:" -ForegroundColor Cyan
    Write-Host "  File name: $($apkFile.Name)" -ForegroundColor White
    Write-Host "  Size: $apkSizeMB MB" -ForegroundColor White
    Write-Host "  Path: $($apkFile.FullName)" -ForegroundColor White
    Write-Host "  Created: $($apkFile.LastWriteTime)" -ForegroundColor White
    Write-Host ""
    Write-Host "APK is ready to install!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install on Android device:" -ForegroundColor Yellow
    Write-Host "  adb install `"$($apkFile.FullName)`"" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Cannot find APK at: $apkPath" -ForegroundColor Yellow
    Write-Host "Checking outputs directory for APK files..." -ForegroundColor Yellow
    
    $outputDir = Join-Path $appDir "build\outputs\apk\release"
    if (Test-Path $outputDir) {
        $apkFiles = Get-ChildItem -Path $outputDir -Filter "*.apk" -ErrorAction SilentlyContinue
        if ($apkFiles) {
            Write-Host ""
            Write-Host "Found APK files:" -ForegroundColor Cyan
            foreach ($file in $apkFiles) {
                $sizeMB = [math]::Round($file.Length / 1MB, 2)
                Write-Host "  - $($file.Name) ($sizeMB MB)" -ForegroundColor White
            }
        }
    }
}

Write-Host ""
