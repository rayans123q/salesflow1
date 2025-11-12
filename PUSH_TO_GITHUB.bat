@echo off
echo ========================================
echo GitHub Push Helper
echo ========================================
echo.
echo INSTRUCTIONS:
echo 1. Create a new repository on GitHub
echo 2. Copy the repository URL (e.g., https://github.com/username/repo.git)
echo 3. Paste it below when prompted
echo.
echo ========================================
echo.

set /p REPO_URL="Enter your GitHub repository URL: "

echo.
echo Adding remote origin...
git remote add origin %REPO_URL%

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Your code is now on GitHub
echo ========================================
pause
