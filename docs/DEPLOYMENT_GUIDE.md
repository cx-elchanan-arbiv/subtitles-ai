# 🚀 מדריך Deployment - לוקאלי + ענן

## 📌 מבנה הקבצים החדש

קבצי `.env` מסודרים לפי environment:

```
📁 Project Root:
├── .env                      ← קובץ פעיל (לא בגיט!)
├── .env.local                ← 🏠 לפיתוח לוקאלי (Docker)
├── .env.render.backend       ← ☁️ להעתקה ל-Render Backend
├── .env.render.worker        ← ☁️ להעתקה ל-Render Worker
└── .env.example              ← 📄 Template ציבורי

📁 frontend/:
├── .env                      ← קובץ פעיל (לא בגיט!)
├── .env.local                ← 🏠 לפיתוח לוקאלי
├── .env.production           ← ☁️ להעתקה ל-Vercel
└── .env.example              ← 📄 Template ציבורי
```

---

## 🏠 חלק 1: וידוא שלוקאלי עובד

### שלב 1.1: החלף את הקבצים

```bash
# במחשב שלך, בתיקיית הפרויקט:
cd /Users/elchananarbiv/Projects/SubsTranslator

# גבה את הקבצים הישנים (למקרה חירום)
cp .env .env.backup_old
cp frontend/.env frontend/.env.backup_old

# החלף לקבצים החדשים
cp .env.local .env
cp frontend/.env.local frontend/.env
```

### שלב 1.2: בדוק שלוקאלי עובד

```bash
# עצור את Docker (אם רץ)
./scripts/stop.sh

# מחק volumes ישנים (ניקוי)
docker-compose down -v

# הפעל מחדש
./scripts/prod.sh

# המתן 30 שניות שהכל יעלה...

# בדוק Backend
curl http://localhost:8081/health
# אמור לראות: {"status":"ok",...}

# בדוק Frontend
curl http://localhost
# אמור לראות HTML

# בדוק Worker logs
docker-compose logs worker | tail -20
# אמור לראות: "celery@... ready"
```

### שלב 1.3: בדיקה דרך UI

1. פתח דפדפן: http://localhost
2. נסה להעלות קובץ ולעבד
3. וודא שהכל עובד כמו קודם ✅

**אם משהו לא עובד** → עצור כאן! החזר את הגיבוי:
```bash
cp .env.backup_old .env
cp frontend/.env.backup_old frontend/.env
./scripts/stop.sh && ./scripts/prod.sh
```

---

## ☁️ חלק 2: הקמה בענן (Render + Vercel)

### 🔐 שלב 2.0: הכנת Secrets (חשוב!)

לפני שמתחילים, תצטרך:

#### A. Upstash Redis Password

1. כנס ל-Upstash Console: https://console.upstash.io/
2. בחר את הדאטהבייס: `complete-oriole-9147`
3. לחץ **Details** → העתק את ה-connection string
4. זה אמור להיראות כך:
   ```
   rediss://default:YOUR_PASSWORD_HERE@complete-oriole-9147.upstash.io:6379
   ```
5. שמור את **YOUR_PASSWORD_HERE** בצד

#### B. Secret Key לFlask

הרץ בטרמינל:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

תקבל משהו כמו: `AbC123XyZ...` ← שמור את זה

#### C. OpenAI API Key

- יש לך את זה כבר: `sk-proj-F358...`
- (אם תרצה למחוק לאחר מכן, צור key חדש ב-OpenAI)

---

### 🔧 שלב 2.1: Render Backend Setup

1. **כנס ל-Render Dashboard**: https://dashboard.render.com/
2. **בחר את השירות**: `substranslator-backend` (או שם דומה)
3. **לחץ**: Environment (בתפריט הצד)
4. **מחק את כל המשתנים הישנים** (או עדכן אחד-אחד)

5. **פתח את הקובץ**: `.env.render.backend` (בעורך טקסט)
6. **החלף את הסודות**:
   - `YOUR_OPENAI_KEY_HERE` → ה-OpenAI key שלך
   - `YOUR_UPSTASH_PASSWORD` → הסיסמה מUpstash (3 פעמים!)
   - `YOUR_GENERATED_SECRET_KEY_HERE` → ה-Secret Key שייצרת

7. **העתק שורה-אחר-שורה ל-Render**:
   - כל שורה זה משתנה נפרד
   - פורמט: `KEY` = `VALUE`
   - אל תעתיק שורות שמתחילות ב-`#` (הערות)

8. **לחץ Save Changes** → Render יעשה **Auto Redeploy**

9. **המתן לסיום ה-Deploy** (3-5 דקות)

10. **בדוק Logs**:
    - Render → Logs tab
    - חפש שגיאות אדומות
    - אמור לראות: `Booting worker with pid...`

11. **בדוק Health**:
```bash
curl https://api.subs.sayai.io/healthz
# אמור לראות: {"status":"ok"}
```

**אם יש שגיאה** → שלח לי את ה-logs, אתקן!

---

### 🔧 שלב 2.2: Render Worker Setup

1. **כנס ל-Render Dashboard**
2. **בחר את השירות**: `substranslator-worker`
3. **לחץ**: Environment
4. **מחק את המשתנים הישנים**

5. **פתח את הקובץ**: `.env.render.worker`
6. **החלף את הסודות** (אותם כמו Backend!)
7. **העתק שורה-אחר-שורה ל-Render**

8. **לחץ Save Changes** → Auto Redeploy

9. **בדוק Logs**:
    - אמור לראות: `celery@substranslator-worker ready`
    - אמור לראות: `Connected to redis://...`

**אם Worker לא מתחבר ל-Redis** → בדוק שה-`REDIS_URL` זהה ב-Backend וב-Worker!

---

### 🌐 שלב 2.3: Vercel Frontend Setup

1. **כנס ל-Vercel Dashboard**: https://vercel.com/dashboard
2. **בחר את הפרויקט** (שם: `substranslator` או דומה)
3. **לחץ**: Settings → Environment Variables

4. **פתח את הקובץ**: `frontend/.env.production`

5. **הוסף כל משתנה בנפרד ל-Vercel**:
   - לחץ **Add New**
   - Name: `REACT_APP_FIREBASE_API_KEY`
   - Value: `AIzaSy...`
   - Environment: **Production** (סמן רק את זה!)
   - לחץ Save

   חזור על זה לכל המשתנים מהקובץ.

6. **Redeploy Frontend**:
   - Vercel → Deployments
   - לחץ על ה-deployment האחרון
   - לחץ **⋮** (שלוש נקודות) → **Redeploy**
   - סמן **Use existing Build Cache** ← בטל!
   - לחץ **Redeploy**

7. **המתן ל-Deploy** (1-2 דקות)

8. **בדוק שזה עובד**:
   - פתח: https://subs.sayai.io
   - פתח Developer Tools (F12) → Network tab
   - נסה להעלות קובץ
   - וודא שהבקשות הולכות ל-`https://api.subs.sayai.io`

---

## ✅ שלב 3: בדיקות End-to-End

### Checklist לבדיקה:

#### לוקאלי ✓
- [ ] `docker-compose ps` מראה 5 services UP
- [ ] `http://localhost:8081/health` מחזיר OK
- [ ] `http://localhost` נפתח
- [ ] העלאת קובץ + עיבוד עובדים
- [ ] הורדת תוצאות עובדת
- [ ] Worker logs מראים: `Task succeeded`

#### ענן ✓
- [ ] `https://api.subs.sayai.io/healthz` מחזיר OK
- [ ] `https://subs.sayai.io` נפתח
- [ ] העלאת קובץ + עיבוד עובדים
- [ ] Render Worker logs מראים: `Task succeeded`
- [ ] הורדת תוצאות עובדת
- [ ] Firebase login עובד

---

## 🚨 Troubleshooting

### בעיה: Backend בRender מחזיר 500

**בדיקות**:
```bash
# בדוק health endpoint
curl https://api.subs.sayai.io/healthz

# בדוק logs בRender
# Render Dashboard → Backend → Logs
```

**סיבות אפשריות**:
- Redis URL לא נכון (בדוק REDIS_URL)
- OpenAI key לא תקין (בדוק OPENAI_API_KEY)
- SECRET_KEY חסר

---

### בעיה: Worker לא מעבד משימות

**בדיקות**:
```bash
# בדוק Worker logs בRender
# אמור לראות: "celery@... ready"

# בדוק שRender Worker רץ
# Dashboard → Worker → Status = "Live"
```

**סיבות אפשריות**:
- Worker לא מתחבר ל-Redis (בדוק CELERY_BROKER_URL)
- Worker crashed (בדוק logs לשגיאות)
- Backend לא שולח tasks (בדוק Backend logs)

---

### בעיה: Frontend לא מתחבר ל-Backend

**בדיקות**:
1. פתח https://subs.sayai.io
2. פתח Developer Tools → Network tab
3. נסה פעולה
4. בדוק לאן הבקשות נשלחות

**אם הבקשות הולכות ל-localhost** → `.env.production` לא עודכן ב-Vercel!

**אם יש CORS error**:
```bash
# בדוק שה-Backend מאפשר את הדומיין
curl -I https://api.subs.sayai.io/health \
  -H "Origin: https://subs.sayai.io"
# צריך לראות: Access-Control-Allow-Origin
```

---

## 📞 צריך עזרה?

אם משהו לא עובד:

1. **עצור** ואל תמשיך
2. **שלח לי**:
   - מה הבעיה (Frontend/Backend/Worker?)
   - העתק של logs (Render או Docker)
   - צילום מסך של שגיאה
3. **אתקן** ביחד איתך!

---

## 🎉 סיימת בהצלחה?

אם הכל עובד (לוקאלי + ענן):

✅ **מזל טוב!** המערכת שלך עובדת בשני environments!

**צעדים הבאים** (אופציונלי):
- [ ] רוטציית מפתחות (OpenAI, Firebase, Upstash)
- [ ] ניקוי .env מגיט
- [ ] הוספת monitoring (Sentry, UptimeRobot)

---

**עדכון אחרון**: 2025-11-16
**גרסה**: 1.0
