# 🚀 Render.com Setup - מדריך מהיר

## ✅ יש לך כבר שירותים ב-Render? עדכן משתנים

### 📍 שלב 1: Backend Service

1. **פתח Render Dashboard**:
   ```bash
   open https://dashboard.render.com/
   ```

2. **בחר את Backend Service** (שם: `substranslator-backend` או דומה)

3. **לחץ על Environment** (בתפריט הצד)

4. **מחק את כל המשתנים הישנים** (או עדכן אחד-אחד)

5. **פתח את הקובץ**: `.env.render.backend.READY`
   ```bash
   open .env.render.backend.READY
   ```

6. **העתק שורה-אחר-שורה**:
   - כל שורה = משתנה נפרד
   - פורמט: `KEY` = `VALUE`
   - **אל תעתיק** שורות שמתחילות ב-`#` (הערות)

7. **דוגמה**:
   ```
   Key: FLASK_ENV
   Value: production

   Key: DEBUG
   Value: False

   Key: SECRET_KEY
   Value: QTfiPoJkWlqKS-bg_OkJ5kS2sfBTtbQCK9TVn1ud7fU

   ...וכן הלאה
   ```

8. **לחץ Save Changes** → Render יעשה **Auto Redeploy**

9. **המתן 3-5 דקות** לסיום Deploy

10. **בדוק Logs**:
    - Render → Logs tab
    - חפש שגיאות אדומות
    - אמור לראות: `Booting worker with pid...`

11. **בדוק Health**:
    ```bash
    curl https://api.subs.sayai.io/healthz
    ```
    אמור לראות: `{"status":"ok"}`

---

### 📍 שלב 2: Worker Service

**בדיוק אותו תהליך**, רק עם:
- Service: `substranslator-worker`
- File: `.env.render.worker.READY`

**חשוב**: ה-Worker צריך **בדיוק אותם משתנים** כמו Backend!

**בדוק Logs**:
- אמור לראות: `celery@substranslator-worker ready`
- אמור לראות: `Connected to redis://...`

---

## ❌ אין לך שירותים? צור מאפס

### עקוב אחרי המדריך המלא:

```bash
open RENDER_DEPLOY.md
```

**או** קרא את החלק הזה:

---

### 🔧 יצירת Backend Service

1. **Render Dashboard** → **New +** → **Web Service**

2. **Connect GitHub Repository**: `SubsTranslator`

3. **הגדרות**:
   - **Name**: `substranslator-backend`
   - **Region**: Europe (Frankfurt)
   - **Branch**: `main`
   - **Environment**: **Docker**
   - **Dockerfile Path**: `./backend.Dockerfile`
   - **Instance Type**: **Standard** (1 CPU / 2GB / $25/month)

4. **Click Advanced** → **Add Environment Variables**
   - העתק מ-`.env.render.backend.READY`

5. **Create Web Service**

6. **המתן ל-Deploy** (5-10 דקות בפעם הראשונה)

7. **הוסף Persistent Disk**:
   - Settings → Disks → **Add Disk**
   - Name: `whisper-cache`
   - Mount Path: `/app/whisper_models`
   - Size: `10 GB`
   - Save → **Confirm Redeploy**

8. **הגדר Health Check**:
   - Settings → Health & Alerts
   - Health Check Path: `/healthz`
   - Save

---

### 🔧 יצירת Worker Service

1. **Render Dashboard** → **New +** → **Background Worker**

2. **Connect Repository**: `SubsTranslator`

3. **הגדרות**:
   - **Name**: `substranslator-worker`
   - **Region**: Europe (Frankfurt) ← **אותו Region כמו Backend!**
   - **Branch**: `main`
   - **Environment**: **Docker**
   - **Dockerfile Path**: `./backend.Dockerfile` ← **אותו Dockerfile!**
   - **Instance Type**: **Starter** (0.5 CPU / 512MB / $7/month)

4. **Start Command**:
   ```bash
   celery -A celery_worker.celery_app worker -l INFO --concurrency=${WORKER_CONCURRENCY:-2} --max-tasks-per-child=${WORKER_MAX_TASKS_PER_CHILD:-100}
   ```

5. **Add Environment Variables**:
   - העתק מ-`.env.render.worker.READY`

6. **Create Background Worker**

7. **הוסף אותו Disk**:
   - Settings → Disks → **Add Disk**
   - Name: `whisper-cache`
   - Mount Path: `/app/whisper_models`
   - Size: `10 GB`

---

## 🎯 בדיקות

### Backend Health:
```bash
curl https://api.subs.sayai.io/healthz
```
צריך: `{"status":"ok"}`

### Worker Logs:
```
Render Dashboard → Worker → Logs
```
צריך לראות: `celery@... ready`

### Redis Connection:
שני השירותים צריכים להראות:
```
Connected to redis://complete-oriole-9147.upstash.io
```

---

## 🚨 בעיות נפוצות

### Backend מחזיר 500
**בדוק**: REDIS_URL, OPENAI_API_KEY, SECRET_KEY

### Worker לא מתחבר
**בדוק**: CELERY_BROKER_URL זהה ב-Backend וב-Worker

### Redis connection failed
**בדוק**: ה-URL מתחיל ב-`rediss://` (עם שתי s!)

---

## 💰 עלות חודשית

| שירות | Instance | עלות |
|-------|----------|------|
| Backend | Standard | $25 |
| Worker | Starter | $7 |
| Disk | 10GB | $0.25 |
| **סה"כ** | | **~$32** |

---

## ✅ סיימת?

אם הכל עובד:
- ✅ Backend health מחזיר OK
- ✅ Worker logs מראים "ready"
- ✅ אין שגיאות ב-logs

**עבור לשלב הבא**: Vercel Frontend Setup
```bash
open DEPLOYMENT_GUIDE.md
```

---

**נוצר**: 2025-11-16
**קבצים**: `.env.render.backend.READY`, `.env.render.worker.READY`
