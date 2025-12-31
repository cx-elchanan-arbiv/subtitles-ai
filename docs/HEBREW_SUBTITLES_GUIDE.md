# כתוביות עבריות - מדריך פתרון בעיות

## 🎯 הבעיה שפתרנו

**תסמינים**: כתוביות מוצגות כריבועים במקום עברית  
**גורם שורש**: Docker Container לא מכיל פונטים עבריים  
**פתרון**: התקנת פונטים עבריים ועדכון הגדרות FFmpeg

## 🔧 השינויים שביצענו

### 1. הוספת פונטים עבריים ל-Dockerfile

```dockerfile
# Install Hebrew fonts in backend.Dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-hinted \
    fonts-noto-unhinted \
    wget

# Download Hebrew fonts directly from Google Fonts
RUN mkdir -p /usr/share/fonts/truetype/hebrew && \
    wget -q "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf" \
         -O /usr/share/fonts/truetype/hebrew/NotoSansHebrew-Regular.ttf && \
    wget -q "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Bold.ttf" \
         -O /usr/share/fonts/truetype/hebrew/NotoSansHebrew-Bold.ttf && \
    fc-cache -fv
```

### 2. עדכון רשימת הפונטים בקוד

```python
# OLD - לא עבד ב-Docker
hebrew_fonts = [
    "Arial Hebrew Scholar",  # macOS only
    "Arial Hebrew",          # macOS only
    "David",                 # Windows only
    "Arial Unicode MS"       # לא זמין
]

# NEW - עובד ב-Docker
hebrew_fonts = [
    "Noto Sans Hebrew",      # 🏆 זה הפונט שעובד!
    "DejaVu Sans",           # גיבוי טוב
    "Liberation Sans",       # זמין ב-Linux
    "Arial Hebrew Scholar",  # אם זמין
    "Arial Hebrew",          # אם זמין
]
```

### 3. שיפור סגנון הכתוביות

```python
# Enhanced Hebrew subtitle style
subtitle_style = (
    f"FontName=Noto Sans Hebrew,"  # הפונט הנכון
    "FontSize=18,"                 # גודל קריא
    "Bold=1,"                      # מודגש
    "PrimaryColour=&HFFFFFF,"      # לבן
    "OutlineColour=&H000000,"      # מתאר שחור
    "BackColour=&H80000000,"       # רקע חצי שקוף
    "Outline=3,"                   # מתאר עבה לבולטות
    "Shadow=2,"                    # צל
    "MarginV=40,"                  # מרחק מהתחתית
    "Alignment=2"                  # יישור מרכז לRTL
)
```

### 4. עיבוד טקסט עברי מתקדם

```python
def fix_hebrew_text_for_subtitles(text):
    """תיקון טקסט עברי לכתוביות"""
    has_hebrew = any('\u0590' <= char <= '\u05FF' for char in text)
    
    if has_hebrew:
        # תיקון סוגריים לעברית
        text = text.replace('(', '֮TEMP֮')
        text = text.replace(')', '(')
        text = text.replace('֮TEMP֮', ')')
        
        # תיקון מספרים ב-RTL
        import re
        def reverse_number(match):
            return match.group(0)[::-1]
        text = re.sub(r'\d[\d,\.]*', reverse_number, text)
        
        # הוספת תווי כיוון Unicode
        text = '\u202E' + text + '\u202C'  # RLO + PDF
    
    return text
```

## ✅ בדיקה שהכל עובד

### 1. בדיקת פונטים בContainer

```bash
# בדיקה שהפונטים מותקנים
docker exec substranslator-backend-1 fc-list | grep -i hebrew

# תוצאה צפויה:
# Noto Sans Hebrew:style=Regular
# Noto Sans Hebrew:style=Bold
# Noto Serif Hebrew:style=Regular
# Noto Rashi Hebrew:style=Regular
```

### 2. בדיקת FFmpeg

```bash
# בדיקה ש-FFmpeg מזהה את הפונט
docker exec substranslator-backend-1 ffmpeg -f lavfi -i color=c=blue:size=200x80:d=1 -vf "drawtext=text='שלום':fontfile=/usr/share/fonts/truetype/hebrew/NotoSansHebrew-Regular.ttf:fontcolor=white:fontsize=24:x=10:y=30" -frames:v 1 test_hebrew.png

# אם עובד - הפונט נמצא ומזוהה
```

### 3. בדיקת תהליך מלא

1. העלה וידאו קצר (30 שניות)
2. בחר עברית כשפת יעד
3. סמן "יצירת וידאו עם כתוביות"
4. בדוק שהכתוביות מוצגות בעברית ולא כריבועים

## 🚨 פתרון בעיות נפוצות

### בעיה: עדיין ריבועים אחרי השינויים

```bash
# פתרון 1: Rebuild מלא
docker-compose down
docker-compose build --no-cache backend worker
docker-compose up -d

# פתרון 2: בדיקת logs
docker-compose logs worker | grep -i font
docker-compose logs worker | grep -i hebrew
```

### בעיה: Container לא עולה אחרי הוספת פונטים

```bash
# בדיקת build process
docker-compose build backend 2>&1 | grep -A 5 -B 5 "wget\|font"

# אם יש שגיאת רשת - נסה בלי wget:
# הורד הפונטים מקומית ועשה COPY במקום wget
```

### בעיה: פונט לא נמצא ב-FFmpeg

```python
# Debug: הדפס את הפונט שנבחר
logger.info(f"🔤 Using font: {hebrew_fonts[0]}")
logger.info(f"🎬 FFmpeg command: {' '.join(cmd)}")

# אם עדיין לא עובד, נסה עם fallback:
hebrew_fonts = ["DejaVu Sans"]  # פונט גיבוי שתמיד עובד
```

## 📋 Checklist לפעם הבאה

אם אי פעם תצטרך להתקין את המערכת במקום חדש:

### ✅ Docker Setup
- [ ] Docker & Docker Compose מותקנים
- [ ] יש לפחות 8GB RAM פנויים
- [ ] יש לפחות 10GB מקום דיסק

### ✅ Hebrew Fonts
- [ ] Dockerfile מכיל התקנת `fonts-noto`
- [ ] יש הורדה של `NotoSansHebrew-Regular.ttf`
- [ ] יש הרצה של `fc-cache -fv`

### ✅ Code Configuration
- [ ] `hebrew_fonts` מתחיל ב-`"Noto Sans Hebrew"`
- [ ] יש `fix_hebrew_text_for_subtitles` function
- [ ] `subtitle_style` מכיל `Alignment=2` ל-RTL
- [ ] `target_language` מועבר ל-`create_video_with_subtitles`

### ✅ Testing
- [ ] `fc-list | grep hebrew` מחזיר תוצאות
- [ ] FFmpeg יכול לצייר טקסט עברי
- [ ] וידאו טסט מציג עברית נכון

## 🔄 Process מומלץ לשינויים עתידיים

1. **בצע שינויים קטנים**: אל תשנה הכל בבת אחת
2. **בדוק בשלבים**: קודם פונטים, אחר כך סגנון
3. **שמור logs**: `docker-compose logs > debug.log`
4. **תעד שינויים**: עדכן את המדריך הזה אחרי כל שינוי

## 💡 טיפים נוספים

### Performance
- Noto Sans Hebrew מהיר וקל יותר מפונטים אחרים
- השתמש ב-cache של פונטים: `fc-cache -fv`

### Quality  
- `FontSize=18` אופטימלי לרוב הרזולוציות
- `Outline=3` מספיק לקריאות טובה
- `Alignment=2` (מרכז) עובד הכי טוב ל-RTL

### Debug
- השתמש ב-`logger.info` כדי לראות איזה פונט נבחר
- בדוק FFmpeg stderr לשגיאות פונטים
- נסה `drawtext` פשוט לפני subtitle מלא

---

**זכור**: הבעיה המרכזית תמיד הייתה שDocker Container לא הכיל פונטים עבריים. הפתרון הוא תמיד להתקין פונטים נכונים ולהגדיר אותם בקוד!
