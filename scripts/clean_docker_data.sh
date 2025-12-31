#!/bin/bash

echo "🧹 מתחיל ניקוי כל הנתונים של דוקר..."

# Stop Docker containers if running
echo "⏹️ עוצר קונטיינרים של דוקר..."
docker-compose down 2>/dev/null || true

# Remove Docker containers
echo "🗑️ מסיר קונטיינרים של דוקר..."
docker-compose rm -f 2>/dev/null || true

# Remove Docker images
echo "🖼️ מסיר תמונות דוקר..."
docker rmi $(docker images -q) 2>/dev/null || true

# Remove Docker volumes
echo "💾 מסיר volumes של דוקר..."
docker volume prune -f 2>/dev/null || true

# Remove Docker networks
echo "🌐 מסיר רשתות דוקר..."
docker network prune -f 2>/dev/null || true

# Clean backend data directories
echo "📁 מנקה תיקיות נתונים של backend..."

# Clean uploads directory
if [ -d "backend/uploads" ]; then
    echo "🗂️ מנקה תיקיית uploads..."
    find backend/uploads -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיית uploads נוקתה"
fi

# Clean downloads directory
if [ -d "backend/downloads" ]; then
    echo "📥 מנקה תיקיית downloads..."
    find backend/downloads -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיית downloads נוקתה"
fi

# Clean user_data directory
if [ -d "backend/user_data" ]; then
    echo "👤 מנקה תיקיית user_data..."
    find backend/user_data -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    find backend/user_data -type d -empty -delete 2>/dev/null || true
    echo "✅ תיקיית user_data נוקתה"
fi

# Clean root downloads directory
if [ -d "downloads" ]; then
    echo "📥 מנקה תיקיית downloads הראשית..."
    find downloads -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיית downloads הראשית נוקתה"
fi

# Clean database directories
if [ -d "backend/database" ]; then
    echo "🗄️ מנקה תיקיות database..."
    find backend/database -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיות database נוקו"
fi

if [ -d "backend/database_new" ]; then
    echo "🗄️ מנקה תיקיות database_new..."
    find backend/database_new -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיות database_new נוקו"
fi

# Clean instance directory (Flask app data)
if [ -d "backend/instance" ]; then
    echo "🏗️ מנקה תיקיית instance..."
    find backend/instance -type f ! -name ".gitkeep" -delete 2>/dev/null || true
    echo "✅ תיקיית instance נוקתה"
fi

# Clean cache directories
echo "🗑️ מנקה תיקיות cache..."
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Clean log files
echo "📝 מנקה קבצי log..."
find . -name "*.log" -type f -delete 2>/dev/null || true

# Clean temporary files
echo "🗂️ מנקה קבצים זמניים..."
find . -name "*.part" -type f -delete 2>/dev/null || true
find . -name "*.tmp" -type f -delete 2>/dev/null || true

# Clean virtual environments (optional - uncomment if you want to remove them)
# echo "🐍 מסיר סביבות וירטואליות..."
# rm -rf backend/venv backend/new_venv backend/test_env 2>/dev/null || true

echo ""
echo "🎉 ניקוי הושלם בהצלחה!"
echo ""
echo "📊 סיכום הניקוי:"
echo "   • קונטיינרים של דוקר הוסרו"
echo "   • תמונות דוקר הוסרו"
echo "   • volumes של דוקר הוסרו"
echo "   • תיקיות uploads/downloads נוקו"
echo "   • תיקיות user_data נוקו"
echo "   • תיקיות database נוקו"
echo "   • קבצי cache נוקו"
echo "   • קבצי log נוקו"
echo ""
echo "💡 כדי להתחיל מחדש, הרץ:"
echo "   docker-compose up --build"
