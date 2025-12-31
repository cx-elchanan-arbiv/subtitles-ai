#!/bin/bash

echo "🔍 בודק מה יש בדוקר לפני הניקוי..."
echo "=========================================="
echo ""

# Check Docker containers
echo "🐳 קונטיינרים של דוקר:"
docker ps -a 2>/dev/null | head -10 || echo "   אין קונטיינרים פעילים"

echo ""

# Check Docker images
echo "🖼️ תמונות דוקר:"
docker images 2>/dev/null | head -10 || echo "   אין תמונות"

echo ""

# Check Docker volumes
echo "💾 volumes של דוקר:"
docker volume ls 2>/dev/null | head -10 || echo "   אין volumes"

echo ""

# Check Docker networks
echo "🌐 רשתות דוקר:"
docker network ls 2>/dev/null | head -10 || echo "   אין רשתות"

echo ""
echo "=========================================="
echo "📁 קבצים ונתונים בפרויקט:"
echo ""

# Check uploads directory
if [ -d "backend/uploads" ]; then
    echo "🗂️ תיקיית uploads:"
    file_count=$(find backend/uploads -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh backend/uploads 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    
    if [ $file_count -gt 0 ]; then
        echo "   📋 רשימת הקבצים הגדולים:"
        find backend/uploads -type f ! -name ".gitkeep" -exec ls -lh {} \; | sort -k5 -hr | head -5 | awk '{print "      " $9 " (" $5 ")"}'
    fi
    echo ""
fi

# Check downloads directory
if [ -d "backend/downloads" ]; then
    echo "📥 תיקיית downloads:"
    file_count=$(find backend/downloads -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh backend/downloads 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    
    if [ $file_count -gt 0 ]; then
        echo "   📋 רשימת הקבצים:"
        find backend/downloads -type f ! -name ".gitkeep" -exec ls -lh {} \; | awk '{print "      " $9 " (" $5 ")"}'
    fi
    echo ""
fi

# Check user_data directory
if [ -d "backend/user_data" ]; then
    echo "👤 תיקיית user_data:"
    total_size=$(du -sh backend/user_data 2>/dev/null | cut -f1)
    echo "   💾 גודל כולל: $total_size"
    
    # Check subdirectories
    for subdir in backend/user_data/*/; do
        if [ -d "$subdir" ]; then
            dir_name=$(basename "$subdir")
            file_count=$(find "$subdir" -type f ! -name ".gitkeep" | wc -l)
            dir_size=$(du -sh "$subdir" 2>/dev/null | cut -f1)
            echo "   📁 $dir_name: $file_count קבצים, גודל: $dir_size"
        fi
    done
    echo ""
fi

# Check root downloads directory
if [ -d "downloads" ]; then
    echo "📥 תיקיית downloads הראשית:"
    file_count=$(find downloads -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh downloads 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    
    if [ $file_count -gt 0 ]; then
        echo "   📋 רשימת הקבצים:"
        find downloads -type f ! -name ".gitkeep" -exec ls -lh {} \; | awk '{print "      " $9 " (" $5 ")"}'
    fi
    echo ""
fi

# Check database directories
if [ -d "backend/database" ]; then
    echo "🗄️ תיקיית database:"
    file_count=$(find backend/database -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh backend/database 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    echo ""
fi

if [ -d "backend/database_new" ]; then
    echo "🗄️ תיקיית database_new:"
    file_count=$(find backend/database_new -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh backend/database_new 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    echo ""
fi

# Check instance directory
if [ -d "backend/instance" ]; then
    echo "🏗️ תיקיית instance:"
    file_count=$(find backend/instance -type f ! -name ".gitkeep" | wc -l)
    total_size=$(du -sh backend/instance 2>/dev/null | cut -f1)
    echo "   📊 מספר קבצים: $file_count"
    echo "   💾 גודל כולל: $total_size"
    echo ""
fi

# Check cache directories
echo "🗑️ תיקיות cache:"
cache_dirs=$(find . -name "__pycache__" -o -name ".pytest_cache" 2>/dev/null | wc -l)
if [ $cache_dirs -gt 0 ]; then
    echo "   📊 מספר תיקיות cache: $cache_dirs"
    total_cache_size=$(find . -name "__pycache__" -o -name ".pytest_cache" -type d -exec du -sh {} \; 2>/dev/null | awk '{sum+=$1} END {print sum "B"}')
    echo "   💾 גודל כולל של cache: $total_cache_size"
else
    echo "   ✅ אין תיקיות cache"
fi
echo ""

# Check log files
echo "📝 קבצי log:"
log_files=$(find . -name "*.log" -type f 2>/dev/null | wc -l)
if [ $log_files -gt 0 ]; then
    echo "   📊 מספר קבצי log: $log_files"
    total_log_size=$(find . -name "*.log" -type f -exec du -sh {} \; 2>/dev/null | awk '{sum+=$1} END {print sum "B"}')
    echo "   💾 גודל כולל של logs: $total_log_size"
    
    echo "   📋 רשימת קבצי log:"
    find . -name "*.log" -type f -exec ls -lh {} \; | awk '{print "      " $9 " (" $5 ")"}'
else
    echo "   ✅ אין קבצי log"
fi
echo ""

# Check temporary files
echo "🗂️ קבצים זמניים:"
temp_files=$(find . -name "*.part" -o -name "*.tmp" -type f 2>/dev/null | wc -l)
if [ $temp_files -gt 0 ]; then
    echo "   📊 מספר קבצים זמניים: $temp_files"
    echo "   📋 רשימת קבצים זמניים:"
    find . -name "*.part" -o -name "*.tmp" -type f -exec ls -lh {} \; | awk '{print "      " $9 " (" $5 ")"}'
else
    echo "   ✅ אין קבצים זמניים"
fi
echo ""

# Check virtual environments
echo "🐍 סביבות וירטואליות:"
venv_dirs=""
if [ -d "backend/venv" ]; then venv_dirs="$venv_dirs backend/venv"; fi
if [ -d "backend/new_venv" ]; then venv_dirs="$venv_dirs backend/new_venv"; fi
if [ -d "backend/test_env" ]; then venv_dirs="$venv_dirs backend/test_env"; fi

if [ -n "$venv_dirs" ]; then
    echo "   📊 תיקיות venv שנמצאו:"
    for venv in $venv_dirs; do
        if [ -d "$venv" ]; then
            venv_size=$(du -sh "$venv" 2>/dev/null | cut -f1)
            echo "      $venv ($venv_size)"
        fi
    done
else
    echo "   ✅ אין תיקיות venv"
fi
echo ""

echo "=========================================="
echo "📊 סיכום כללי:"
total_project_size=$(du -sh . 2>/dev/null | cut -f1)
echo "💾 גודל כולל של הפרויקט: $total_project_size"
echo ""
echo "💡 כדי לנקות הכל, הרץ: ./clean_docker_data.sh"
