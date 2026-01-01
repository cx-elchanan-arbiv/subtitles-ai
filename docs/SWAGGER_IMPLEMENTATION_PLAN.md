# תכנון הוספת Swagger/OpenAPI לפרויקט SubsTranslator

**תאריך:** 2025-01-01
**סטטוס:** ממתין לאישור
**משך זמן משוער:** 3-4 שעות

---

## 1. מה זה Swagger/OpenAPI? (הסבר פשוט)

### בשפה פשוטה:
**Swagger** הוא כלי שיוצר **דף אינטרנט אינטראקטיבי** שמתאר את כל ה-API שלך.

במקום שמפתח יצטרך:
1. לקרוא קוד
2. לנחש מה לשלוח
3. להתייאש ולשאול אותך ב-Slack

הוא יכול:
1. לפתוח `https://your-api.com/docs`
2. לראות את כל ה-endpoints
3. **ללחוץ "Try it out"** ולבדוק ישירות!

### דוגמה ויזואלית:

```
┌─────────────────────────────────────────────────────────────────┐
│  SubsTranslator API Documentation                    [Try it!] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ▼ Video Processing                                             │
│    ├── POST /api/v1/upload      Upload video file               │
│    ├── POST /api/v1/youtube     Process YouTube URL             │
│    └── GET  /api/v1/status/{id} Get task status                 │
│                                                                 │
│  ▼ Downloads                                                    │
│    └── GET  /api/v1/download/{filename}                         │
│                                                                 │
│  ▼ Video Editing                                                │
│    ├── POST /api/v1/cut-video                                   │
│    ├── POST /api/v1/merge-videos                                │
│    └── POST /api/v1/embed-subtitles                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

כשלוחצים על endpoint, רואים:
- **Parameters:** מה לשלוח (שדות, סוגים, האם חובה)
- **Responses:** מה חוזר (200 OK, 400 Error, וכו')
- **Try it out:** כפתור לבדיקה אמיתית!

---

## 2. למה זה חשוב? (הערך העסקי)

### 2.1 לצוות הפיתוח
| בעיה היום | פתרון עם Swagger |
|-----------|------------------|
| "איזה שדות צריך לשלוח?" | מתועד אוטומטית |
| "מה חוזר כשיש שגיאה?" | מוגדר בסכמה |
| "איך בודקים endpoint?" | Try it out בדפדפן |
| "מה השתנה ב-API?" | גרסאות מתועדות |

### 2.2 לאינטגרציות
- **Frontend:** יודע בדיוק מה לשלוח ומה לצפות
- **Mobile:** אותו דבר
- **צד שלישי:** יכול להתחבר בלי לקרוא קוד

### 2.3 לפרויקט Open Source
- **נראה מקצועי** - כמו Stripe, GitHub, Twilio
- **מוריד חסמי כניסה** - מפתחים חדשים מבינים מהר
- **מגדיל אימוץ** - קל להתחיל להשתמש

---

## 3. הספרייה שנשתמש בה: Flasgger

### למה Flasgger?
| ספרייה | יתרונות | חסרונות |
|--------|---------|---------|
| **Flasgger** | קל להתקנה, עובד עם Flask, תיעוד בקוד | פחות גמיש |
| flask-restx | יותר פיצ'רים | מורכב יותר, דורש שכתוב |
| apispec | גמיש מאוד | צריך לכתוב הכל ידנית |

**בחירה: Flasgger** - הכי מהיר להטמעה עם התשתית הקיימת.

### התקנה:
```bash
pip install flasgger
```

---

## 4. איך זה עובד טכנית?

### 4.1 הגדרה בסיסית (app.py)

```python
from flasgger import Swagger

app = Flask(__name__)

# הגדרת Swagger
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"  # <- כאן יהיה הדוקומנטציה
}

swagger_template = {
    "info": {
        "title": "SubsTranslator API",
        "description": "AI-powered video subtitle translation API",
        "version": "1.0.0",
        "contact": {
            "name": "API Support",
            "url": "https://github.com/cx-elchanan-arbiv/subtitles-ai"
        }
    },
    "basePath": "/api/v1",
    "schemes": ["https", "http"]
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)
```

### 4.2 תיעוד Endpoint (דוגמה מלאה)

```python
@youtube_bp.route("/youtube", methods=["POST"])
def process_youtube_async():
    """
    Process a YouTube video URL
    ---
    tags:
      - Video Processing
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - url
          properties:
            url:
              type: string
              description: YouTube video URL
              example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            source_lang:
              type: string
              description: Source language code
              default: "auto"
              example: "en"
            target_lang:
              type: string
              description: Target language code
              default: "he"
              example: "he"
            auto_create_video:
              type: boolean
              description: Create video with burned subtitles
              default: false
            whisper_model:
              type: string
              description: Whisper model size
              enum: ["tiny", "base", "small", "medium", "large"]
              default: "large"
            translation_service:
              type: string
              description: Translation provider
              enum: ["google", "openai"]
              default: "google"
    responses:
      202:
        description: Task accepted and processing started
        schema:
          type: object
          properties:
            task_id:
              type: string
              description: Unique task identifier
              example: "abc123-def456"
            state:
              type: string
              example: "PENDING"
            progress:
              type: object
              properties:
                overall_percent:
                  type: integer
                  example: 0
      400:
        description: Invalid request
        schema:
          type: object
          properties:
            error:
              type: string
              example: "URL is required"
      500:
        description: Server error
    """
    # ... הקוד הקיים ...
```

---

## 5. תכנית ההטמעה המפורטת

### שלב 1: התקנה והגדרה בסיסית (30 דקות)

**קבצים שישתנו:**
- `backend/requirements.txt` - הוספת flasgger
- `backend/app.py` - הגדרת Swagger

**מה נעשה:**
1. הוספת `flasgger` ל-requirements.txt
2. הוספת קונפיגורציה ל-app.py
3. בדיקה ש-`/docs` עובד

**תוצאה:**
- דף ריק ב-`/docs` שמציג את ה-API

---

### שלב 2: תיעוד V1 Routes (90 דקות)

**קבצים שישתנו:**
```
backend/api/v1/
├── upload_routes.py     # הוספת docstrings
├── youtube_routes.py    # הוספת docstrings
├── status_routes.py     # הוספת docstrings
├── download_routes.py   # הוספת docstrings
└── watermark_routes.py  # הוספת docstrings
```

**Endpoints לתיעוד:**

| Endpoint | Priority | Complexity |
|----------|----------|------------|
| POST /upload | High | Medium |
| POST /youtube | High | Medium |
| GET /status/{id} | High | Low |
| GET /download/{filename} | Medium | Low |
| POST /download-video-only | Medium | Low |
| POST /clear-watermark-logo | Low | Low |
| POST /cleanup-logos | Low | Low |

---

### שלב 3: תיעוד Editing Routes (45 דקות)

**קובץ:** `backend/api/editing_routes.py`

**Endpoints:**
- POST /cut-video
- POST /merge-videos
- POST /embed-subtitles
- POST /add-watermark

---

### שלב 4: תיעוד Health & Stats (30 דקות)

**קבצים:**
- `backend/api/health_routes.py`
- `backend/api/stats_routes.py`

**Endpoints:**
- GET /health
- GET /languages
- GET /translation-services
- GET /stats

---

### שלב 5: סכמות משותפות (30 דקות)

**קובץ חדש:** `backend/api/schemas.py`

```python
# הגדרות סכמות שחוזרות על עצמן
task_response = {
    "type": "object",
    "properties": {
        "task_id": {"type": "string"},
        "state": {"type": "string", "enum": ["PENDING", "PROGRESS", "SUCCESS", "FAILURE"]},
        "progress": {
            "type": "object",
            "properties": {
                "overall_percent": {"type": "integer"},
                "steps": {"type": "array"}
            }
        },
        "result": {"type": "object"},
        "error": {"type": "object"}
    }
}

error_response = {
    "type": "object",
    "properties": {
        "error": {"type": "string"},
        "code": {"type": "string"}
    }
}
```

---

## 6. סיכום זמנים

| שלב | זמן | תלות |
|-----|-----|------|
| 1. התקנה והגדרה | 30 דק | - |
| 2. V1 Routes | 90 דק | שלב 1 |
| 3. Editing Routes | 45 דק | שלב 1 |
| 4. Health & Stats | 30 דק | שלב 1 |
| 5. סכמות משותפות | 30 דק | שלבים 2-4 |
| **סה"כ** | **~4 שעות** | |

---

## 7. מה נקבל בסוף?

### 7.1 דף דוקומנטציה חי
- זמין ב-`https://your-api.com/docs`
- אינטראקטיבי - אפשר לבדוק endpoints
- מעודכן אוטומטית מהקוד

### 7.2 OpenAPI JSON
- זמין ב-`https://your-api.com/apispec.json`
- אפשר לייבא ל-Postman
- אפשר ליצור SDK אוטומטית

### 7.3 תיעוד בקוד
- כל פונקציה מתועדת
- קל לתחזוקה - שינוי בקוד = שינוי בדוקומנטציה

---

## 8. דוגמה לתוצאה הסופית

לאחר ההטמעה, כניסה ל-`/docs` תציג:

```
┌─────────────────────────────────────────────────────────────────┐
│  SubsTranslator API v1.0.0                                      │
│  AI-powered video subtitle translation                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Video Processing                                               │
│  ─────────────────                                              │
│  POST   /api/v1/upload              Upload and process video    │
│  POST   /api/v1/youtube             Process YouTube URL         │
│  POST   /api/v1/download-video-only Download without processing │
│  GET    /api/v1/status/{task_id}    Get processing status       │
│                                                                 │
│  Downloads                                                      │
│  ─────────────                                                  │
│  GET    /api/v1/download/{filename} Download processed file     │
│                                                                 │
│  Video Editing                                                  │
│  ─────────────                                                  │
│  POST   /api/v1/cut-video           Cut video segment           │
│  POST   /api/v1/merge-videos        Merge multiple videos       │
│  POST   /api/v1/embed-subtitles     Embed subtitles in video    │
│  POST   /api/v1/add-watermark       Add watermark to video      │
│                                                                 │
│  System                                                         │
│  ──────                                                         │
│  GET    /health                     Health check                │
│  GET    /languages                  Get supported languages     │
│  GET    /translation-services       Get available services      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. סיכונים ומיטיגציות

| סיכון | הסתברות | השפעה | מיטיגציה |
|-------|---------|-------|----------|
| Flasgger לא תואם לגרסת Flask | נמוכה | גבוהה | נבדוק תאימות לפני |
| התיעוד לא מסונכרן עם הקוד | בינונית | בינונית | הכל בקוד, לא נפרד |
| עומס על השרת | נמוכה | נמוכה | /docs נטען פעם אחת |

---

## 10. שאלות לאישור

1. **האם להתחיל עם כל ה-endpoints או רק הראשיים?**
   - המלצה: להתחיל עם V1 (הראשיים) ואז להרחיב

2. **האם צריך אותנטיקציה על /docs?**
   - המלצה: כן, בפרודקשן לחסום או להגביל

3. **האם להוסיף דוגמאות קוד (curl, Python)?**
   - אפשרי עם הגדרה נוספת, לא חובה בשלב ראשון

---

## 11. צעדים הבאים

- [ ] אישור התכנית ע"י המנהל
- [ ] התקנת flasgger והגדרה בסיסית
- [ ] תיעוד endpoints לפי סדר עדיפות
- [ ] בדיקה ו-code review
- [ ] Deploy לסביבת staging
- [ ] Deploy לפרודקשן

---

**נכתב ע"י:** Claude Code
**לבדיקה ע"י:** [שם המנהל]
**סטטוס:** ממתין לאישור
