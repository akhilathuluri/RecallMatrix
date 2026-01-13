# Fix Guide - Resolving Import Errors

## Issues Identified

**Total Issues: 18**
- 2 Python import errors (`loguru`, `httpx`)
- 2 TypeScript type definition warnings (non-critical)
- 14 related downstream type checking issues

## Quick Fix (Recommended)

### Option 1: Run the Setup Script

```powershell
# From the project root
.\install-python-deps.ps1
```

This will install all Python dependencies and resolve import errors.

### Option 2: Manual Installation

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Option 3: System-Wide Installation

```powershell
# Install without virtual environment
pip install loguru httpx fastapi uvicorn python-telegram-bot asyncpg supabase openai httpx
```

---

## Detailed Problem Breakdown

### 1. Python Import Errors (2 issues)

**File**: `backend/app/services/image_analysis_service.py`

**Errors**:
- Line 9: `from loguru import logger` - Import could not be resolved
- Line 10: `import httpx` - Import could not be resolved

**Cause**: Packages not installed in Python environment

**Fix**: Install packages
```powershell
pip install loguru httpx
```

### 2. TypeScript Type Definitions (2 warnings)

**File**: `tsconfig.json`

**Warnings**:
- Cannot find type definition file for 'phoenix'
- Cannot find type definition file for 'trusted-types'

**Status**: ✅ Already handled with `skipLibCheck: true` in tsconfig.json

**Impact**: None - these are non-critical warnings

### 3. Downstream Type Checking (14 issues)

**Cause**: Cascading effect from the 2 main Python import errors

**Fix**: Automatically resolved when main imports are fixed

---

## Verification Steps

After running the fixes:

1. **Check Python imports**
   ```powershell
   cd backend
   python -c "import loguru; import httpx; print('✓ All imports working')"
   ```

2. **Check VS Code**
   - Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
   - Verify no red squiggly lines in `image_analysis_service.py`

3. **Run the backend**
   ```powershell
   cd backend
   python main.py
   ```

4. **Check TypeScript**
   ```powershell
   npm run typecheck
   ```

---

## VS Code Python Configuration

The following `.vscode/settings.json` has been created to help VS Code find Python packages:

```json
{
  "python.analysis.extraPaths": [
    "${workspaceFolder}/backend",
    "${workspaceFolder}/backend/app"
  ],
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/Scripts/python.exe"
}
```

**Action Required**:
1. Install Python extension for VS Code if not installed
2. Select correct Python interpreter:
   - Press `Ctrl+Shift+P`
   - Type "Python: Select Interpreter"
   - Choose `.\backend\venv\Scripts\python.exe`

---

## Common Issues & Solutions

### Issue: "venv not recognized"

**Solution**: Create virtual environment first
```powershell
cd backend
python -m venv venv
```

### Issue: "pip not found"

**Solution**: Python not installed or not in PATH
```powershell
# Check Python installation
python --version

# If not found, download from python.org
```

### Issue: "Permission denied"

**Solution**: Run as administrator or use --user flag
```powershell
pip install --user loguru httpx
```

### Issue: "Import errors persist after installation"

**Solution**: Reload VS Code window
- Press `Ctrl+Shift+P`
- Type "Developer: Reload Window"
- Wait for Python analysis to complete

### Issue: "Wrong Python interpreter"

**Solution**: Select correct interpreter
1. Press `Ctrl+Shift+P`
2. Type "Python: Select Interpreter"
3. Choose the venv interpreter
4. Reload window

---

## Summary

✅ **Root Cause**: Python packages not installed
✅ **Fix**: Run `.\install-python-deps.ps1` or `pip install -r backend/requirements.txt`
✅ **Verification**: Reload VS Code, check for errors
✅ **Expected Result**: All 18 issues resolved

---

## Scripts Created

1. **`install-python-deps.ps1`** - Quick installation script (root directory)
2. **`backend/setup.ps1`** - Full setup with virtual environment
3. **`.vscode/settings.json`** - VS Code Python configuration

Choose the approach that works best for your setup!
