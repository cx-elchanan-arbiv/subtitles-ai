# 🎬 START HERE — מדריך אישי שלי לפרויקט

> אם חזרת לפרויקט אחרי חודשים ושכחת הכל — תקרא רק את הקובץ הזה.
> כל השאר זה הרחבה.

---

## ⚡ TL;DR — 3 הפקודות שאני צריך

```bash
# 1. הפעלה (פעם ראשונה ביום)
docker-compose up -d

# 2. גישה לאפליקציה
open http://localhost

# 3. עצירה בסוף היום
docker-compose down
```

זהו. **לא צריך כלום מעבר לזה ב-99% מהמקרים.**

---

## 🚀 איך מפעילים את הפרויקט

### 🟢 הדרך הנכונה תמיד — Docker
```bash
docker-compose up -d
```
- עולה ב-10 שניות (השירותים כבר בנויים)
- האתר נטען ב-`http://localhost` (= `http://127.0.0.1`)
- הכל פשוט עובד — Backend, Frontend, Redis, Celery, Beat

### 🟠 הסקריפט עם התפריט
```bash
./scripts/start
```
נפתח תפריט. **בחר אופציה 4** (Production - Docker).
- אופציה 4 בונה מחדש את ה-images → לוקח 5-15 דקות בפעם הראשונה, מהיר אחר כך אם הכל בקאש
- במקום זה: עדיף פשוט `docker-compose up -d`

### 🔴 מה לא ללחוץ
- **אופציה 2 ו-3** (Development modes) → הם דורשים הגדרות נוספות שלא הוגדרו מעולם.
  אם אתה חייב להשתמש בהם, ראה "בעיות ידועות" למטה.

---

## 🌐 כתובות לזכור

| מה | איפה |
|----|------|
| האתר | `http://localhost` (פורט 80) |
| Backend API ישיר | `http://localhost:8081` |
| Health check | `http://localhost:8081/health` |
| Redis (לדיבוג בלבד) | `localhost:6379` |

---

## 📥 איפה הקבצים שהורדתי?

הקבצים נשמרים ב-**Docker volume** בשם `downloads` (לא בתיקייה רגילה).

### לראות אילו קבצים יש
```bash
docker exec substranslator-backend-1 ls /app/downloads
```

### להוריד דרך הדפדפן (הדרך הרגילה)
פשוט לחץ על כפתור ההורדה ב-UI אחרי שהמשימה מסתיימת.

### לקבל קישור הורדה ישיר
```
http://localhost:8081/download/SHEM_HAKOVETZ.mp4
```

---

## 📋 רואים מה קורה — לוגים

### לוג חי של ה-worker (החלק הכי שימושי — מציג הורדה ועיבוד בזמן אמת)
```bash
docker-compose logs -f worker
```
`Ctrl+C` כדי לצאת.

### לוגים של שירותים אחרים
```bash
docker-compose logs -f backend   # ה-API
docker-compose logs -f frontend  # nginx
docker-compose logs -f redis     # redis
docker-compose logs -f beat      # תזמון ניקויים
```

### רק 50 השורות האחרונות (לא נשארים תקועים)
```bash
docker-compose logs --tail=50 worker
```

### דרך GUI
פתח את **Docker Desktop** מהסרגל → containers → קליק על container → לוגים.

---

## 🛑 לעצור הכל

```bash
docker-compose down
```

או דרך הסקריפט:
```bash
./scripts/stop.sh
```

(`docker-compose down` שומר את ה-volume `downloads` עם הקבצים — לא מאבד מידע.)

---

## 🔧 בעיות ידועות ופתרונות

### "Failed to compile" / מסך שחור ב-`localhost:3000`
**סיבה:** ניסית להריץ Dev Mode (אופציה 3) בלי הגדרות נכונות.
**פתרון:** השתמש ב-Docker. תשכח מ-port 3000.

### Redis connection error בלוגים
**סיבה:** אתה רץ במצב dev (לא Docker) ו-`REDIS_URL` ב-`.env` מצביע על hostname של Docker.
**פתרון:** עבור ל-Docker (`docker-compose up -d`).

### האתר נטען אבל לא קורה כלום בלחיצה על "הורד"
**סיבה אפשרית:** לחצת לפני שה-worker עלה לגמרי, וה-polling של ה-UI נעצר.
**פתרון:**
1. רענן את הדף (`Cmd+R`) — ה-UI ייקח את הסטטוס המעודכן ויראה את כפתור ההורדה.
2. אם המשימה רצה, בדוק סטטוס ידנית:
   ```bash
   curl http://localhost:8081/status/TASK_ID
   ```

### "Port 80 already in use"
משהו אחר תופס את הפורט. בדוק:
```bash
lsof -i :80
```
ועצור את התהליך.

---

## 🎛️ פעולות שימושיות נוספות

### עדכון הקוד מ-git (אם משכת שינויים)
```bash
git pull
docker-compose up -d --build   # build רק אחרי שינויי קוד
```

### לראות איזה containers רצים
```bash
docker-compose ps
```

### היכנס לתוך container (לדיבוג מתקדם)
```bash
docker exec -it substranslator-backend-1 bash
```

### לראות statistics של הורדות
```bash
docker exec substranslator-backend-1 cat /app/storage/stats/stats.jsonl
```

### לנקות הכל ולהתחיל מאפס (זהיר — מוחק קבצים!)
```bash
docker-compose down -v   # -v מוחק גם volumes
docker-compose up -d --build
```

---

## 📡 ה-API עצמו (אם רוצים להפעיל בלי UI)

### הורדה בלבד (YouTube)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/VIDEO_ID"}' \
  http://localhost:8081/download-video-only
```

### הורדה + תרגום לעברית
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/VIDEO_ID","target_lang":"he","auto_create_video":true,"whisper_model":"base"}' \
  http://localhost:8081/youtube
```

### בדיקת סטטוס משימה
```bash
curl http://localhost:8081/status/TASK_ID
```

### רשימת שפות נתמכות
```bash
curl http://localhost:8081/languages
```

---

## 🗺️ מבנה הפרויקט בגדול

```
SubsTranslator/
├── backend/        Python Flask + Celery (API + עיבוד וידאו)
├── frontend/       React + TypeScript (ה-UI שאתה רואה)
├── scripts/        סקריפטים להפעלה/עצירה
├── docs/           תיעוד מפורט (אם רוצים לצלול)
└── docker-compose.yml   הקובץ שמגדיר את כל ה-stack
```

### השירותים (containers)
- **backend** — Flask API, פורט 8081
- **frontend** — nginx + React build, פורט 80
- **worker** — Celery worker, מעבד וידאו ברקע
- **beat** — Celery scheduler, מריץ משימות ניקוי תקופתיות
- **redis** — תור משימות + cache, פורט 6379

---

## 📝 מה למדנו בדיבוג היום (כדי שלא יקרה שוב)

### היו 3 בעיות נסתרות במצב Dev שלא יקרו במצב Docker:
1. **ESLint חוסם קומפילציה** — קוד עם טקסטים לא מתורגמים נכשל. תוקן ב-`frontend/package.json` עם `DISABLE_ESLINT_PLUGIN=true`.
2. **Firebase דורש env vars** — `frontend/src/firebase/config.ts` זורק שגיאה אם חסר משתנה. תוקן ע"י יצירת `frontend/.env.local` עם placeholders.
3. **Redis URL כפול** — `.env` מצביע על hostname של Docker (`redis`), אבל dev mode צריך `localhost`. תוקן ב-`scripts/dev-full.sh` עם `REDIS_URL=redis://localhost:6379/0`.

ועוד: סדר `load_dotenv()` ב-`backend/app.py` תוקן כך שיירוץ לפני import של config.

**אבל שוב — במצב Docker אף אחת מהבעיות האלה לא רלוונטית.** Docker פשוט עובד.

---

## ✅ הצ'ק־ליסט שלי לפעם הבאה שאחזור

1. [ ] `cd ~/Projects/SubsTranslator`
2. [ ] `docker-compose up -d`
3. [ ] חכה 10-15 שניות
4. [ ] פתח `http://localhost`
5. [ ] השתמש 🎬
6. [ ] בסוף: `docker-compose down`

---

> **תזכורת לעצמי:** אם משהו לא עובד — קודם תוודא שאתה ב-Docker mode ולא ב-Dev mode. זה תמיד התשובה.
