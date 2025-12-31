# 🔒 Security Cleanup Checklist - לפני Public Release

> **מטרה**: להבטיח שאין secrets/credentials חשופים לפני שהפרויקט הופך לציבורי

---

## 📋 רשימת משימות - עשה לפי הסדר!

### ✅ שלב 1: ניקוי Git History (CRITICAL!)

#### 1.1 בדוק אם יש secrets בhistory

```bash
# חפש .env files בhistory
git log --all --full-history -- "*.env"
git log --all --full-history -- ".env"

# חפש API keys בhistory
git log --all -S "sk-proj-" --source --all
git log --all -S "OPENAI_API_KEY" --source --all
git log --all -S "FIREBASE_API_KEY" --source --all
```

**אם מצאת commits עם secrets** → המשך לשלב 1.2

**אם לא מצאת** → דלג לשלב 2

---

#### 1.2 הסר קבצים רגישים מGit (אם נמצאו)

```bash
# הסר .env files מGit tracking (אבל שמור local)
git rm --cached .env
git rm --cached frontend/.env
git rm --cached frontend/.env.production
git rm --cached .env.backup
git rm --cached .env.development
git rm --cached .env.production
git rm --cached .env.runpod
git rm --cached .env.runpod.backup

# Commit השינוי
git commit -m "Remove tracked .env files from Git"

# Push (אם יש remote)
git push origin main
```

**⚠️ שים לב**: זה רק מסיר מtracking עתידי, לא מהhistory!

---

#### 1.3 (אופציונלי) נקה Git History לחלוטין

**רק אם באמת יש secrets בhistory!**

```bash
# אופציה 1: BFG Repo-Cleaner (מומלץ)
# התקנה:
brew install bfg  # macOS

# שימוש:
bfg --delete-files .env
bfg --delete-files '*.env'
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# אופציה 2: git filter-branch (ידני)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

**⚠️ אזהרה**: זה משנה את כל ההיסטוריה! עשה backup לפני!

---

### ✅ שלב 2: עדכון .gitignore

ודא ש-`.gitignore` חוסם את כל הקבצים הרגישים:

```bash
# בדוק את .gitignore הנוכחי
cat .gitignore | grep -E "\.env|secret|key|password"
```

**אמור לראות**:
```gitignore
# Environment files
.env
.env.*
!.env.example
!.env.render.example

# Backups
*.backup
*.bak

# Logs (might contain secrets)
*.log
logs/
```

**אם משהו חסר** → ערוך `.gitignore` והוסף.

---

### ✅ שלב 3: רוטציית API Keys & Secrets

#### 3.1 OpenAI API Key

**סיבה**: ה-key נמצא ב-`.env` שהיה בגיט!

1. כנס ל-OpenAI Platform: https://platform.openai.com/api-keys
2. **מחק** את ה-key הישן: `sk-proj-F3587gQ7FPQKZbp47eNF...`
3. **צור** key חדש: "SubsTranslator Production"
4. **העתק** את ה-key החדש
5. **עדכן** ב-Render (Backend + Worker):
   - Render Dashboard → Environment → `OPENAI_API_KEY`
6. **עדכן** לוקאלית:
   ```bash
   # ערוך .env.local ו-.env
   OPENAI_API_KEY=sk-proj-NEW_KEY_HERE
   ```

---

#### 3.2 Firebase API Keys

**סיבה**: ה-keys פומביים ב-`frontend/.env`

**שאלה**: האם Firebase keys צריכים להיות סודיים?
- **תשובה**: לא! Firebase API keys מיועדים להיות פומביים (בclient-side apps)
- **אבל**: יש להגדיר **Domain Restrictions** בFirebase Console

**מה לעשות**:

1. כנס ל-Firebase Console: https://console.firebase.google.com/
2. בחר פרויקט: `substranslator-a2bb4`
3. Settings → Authorized domains
4. **הסר** כל domain שאינו:
   - `subs.sayai.io`
   - `localhost`
   - `substranslator-a2bb4.firebaseapp.com`
5. Authentication → Sign-in method → Google
6. וודא ש-**OAuth redirect URIs** כוללים רק:
   - `https://subs.sayai.io/__/auth/handler`
   - `http://localhost/__/auth/handler`

**תוצאה**: גם אם מישהו יעתיק את ה-keys, הם לא יעבדו מdomain אחר!

---

#### 3.3 Upstash Redis Password

**סיבה**: הסיסמה נחשפה בchat (לפי `RENDER_DEPLOY.md`)

1. כנס ל-Upstash Console: https://console.upstash.io/
2. בחר database: `complete-oriole-9147`
3. לחץ **Details** → **Reset Password**
4. **העתק** את ה-connection string החדש
5. **עדכן** ב-Render (Backend + Worker):
   ```
   REDIS_URL=rediss://default:NEW_PASSWORD@complete-oriole-9147.upstash.io:6379
   CELERY_BROKER_URL=rediss://default:NEW_PASSWORD@complete-oriole-9147.upstash.io:6379/0
   CELERY_RESULT_BACKEND=rediss://default:NEW_PASSWORD@complete-oriole-9147.upstash.io:6379/0
   LIMITER_STORAGE_URI=rediss://default:NEW_PASSWORD@complete-oriole-9147.upstash.io:6379/1
   ```
6. **עדכן** לוקאלית: (רק אם אתה משתמש בUpstash לוקאלית - בדר"כ לא!)

---

#### 3.4 Flask SECRET_KEY

**סיבה**: ה-key הנוכחי הוא `local-dev-secret-key-change-in-production`

1. **צור** secret חדש:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **עדכן** ב-Render (Backend + Worker):
   ```
   SECRET_KEY=<NEW_SECRET_HERE>
   ```

3. **השאר** לוקאלית כמו שזה (זה בסדר לdev)

---

### ✅ שלב 4: ניקוי קבצים מיותרים

```bash
# מחק קבצי backup ישנים
rm -f .env.backup*
rm -f .env.runpod*
rm -f frontend/.env.backup*

# מחק .env files שלא בשימוש
rm -f .env.development
rm -f .env.production

# השאר רק:
# - .env.local (לפיתוח)
# - .env.render.backend (template לRender)
# - .env.render.worker (template לRender)
# - .env.example (template ציבורי)
```

**Commit**:
```bash
git add .
git commit -m "chore: Remove unused .env files and backups"
git push origin main
```

---

### ✅ שלב 5: עדכון Templates הציבוריים

#### 5.1 עדכן .env.example

ודא שהקובץ **לא** מכיל secrets אמיתיים:

```bash
cat .env.example | grep -E "sk-|AIza|rediss://"
```

**אם מצאת משהו** → ערוך והחלף ל-placeholders:
```bash
OPENAI_API_KEY=your-openai-api-key-here
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
```

---

#### 5.2 עדכן frontend/.env.example

אותו דבר לפרונטאנד:
```bash
cat frontend/.env.example | grep -E "AIza|sk-"
```

---

### ✅ שלב 6: בדיקות אבטחה

#### 6.1 סרוק secrets בקוד

```bash
# התקן truffleHog (אופציונלי)
brew install truffleHog  # macOS
# או
pip install truffleHog

# סרוק
trufflehog git file://. --only-verified
```

---

#### 6.2 בדוק hardcoded secrets בקוד

```bash
# חפש API keys בקוד
grep -r "sk-proj-" backend/ frontend/ --exclude-dir=node_modules
grep -r "AIza" backend/ frontend/ --exclude-dir=node_modules

# חפש passwords
grep -r "password\s*=\s*['\"]" backend/ frontend/ --exclude-dir=node_modules

# חפש tokens
grep -r "token\s*=\s*['\"]" backend/ frontend/ --exclude-dir=node_modules
```

**אם מצאת משהו** → הסר ושים במשתני סביבה!

---

### ✅ שלב 7: תיעוד

#### 7.1 הוסף אזהרה ל-README

הוסף למעלה ב-`README.md`:

```markdown
> **⚠️ Security Notice**: This project requires API keys and secrets.
> Never commit `.env` files to Git. See `.env.example` for required variables.
```

---

#### 7.2 צור SECURITY.md

```bash
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email: your-email@example.com

**Do not** open a public GitHub issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Best Practices

- Never commit `.env` files
- Rotate API keys regularly
- Use environment variables for all secrets
- Enable 2FA on all accounts (GitHub, OpenAI, Firebase, etc.)

EOF
```

---

### ✅ שלב 8: בדיקה סופית

```bash
# 1. וודא שאין .env files בgit status
git status | grep ".env"
# אמור להיות ריק!

# 2. וודא שאין secrets בstaged changes
git diff --cached | grep -E "sk-proj-|AIza|rediss://"
# אמור להיות ריק!

# 3. בדוק .gitignore
git check-ignore .env
git check-ignore frontend/.env
# אמור להדפיס את הנתיבים (כלומר, הם מוגדרים להתעלם)

# 4. בדוק שלוקאלי עדיין עובד
./scripts/prod.sh
curl http://localhost:8081/health

# 5. בדוק שענן עדיין עובד
curl https://api.subs.sayai.io/healthz
```

---

## 📊 Checklist סיכום

הדפס את זה ותסמן ✅ בעט:

```
🔒 SECURITY CLEANUP - DONE?

שלב 1: Git History
├─ [ ] בדקתי אם יש secrets בhistory
├─ [ ] הסרתי .env files מtracking
└─ [ ] (אופציונלי) ניקיתי history עם BFG

שלב 2: .gitignore
├─ [ ] וידאתי ש-.env מוגדר ב-.gitignore
└─ [ ] בדקתי עם git check-ignore

שלב 3: רוטציית Keys
├─ [ ] רוטטתי OpenAI API key
├─ [ ] הגדרתי Domain Restrictions בFirebase
├─ [ ] רוטטתי Upstash Redis password
└─ [ ] שיניתי Flask SECRET_KEY

שלב 4: ניקוי קבצים
├─ [ ] מחקתי .env.backup files
└─ [ ] מחקתי .env files שלא בשימוש

שלב 5: Templates
├─ [ ] וידאתי ש-.env.example נקי
└─ [ ] וידאתי ש-frontend/.env.example נקי

שלב 6: בדיקות אבטחה
├─ [ ] סרקתי secrets עם truffleHog
└─ [ ] חיפשתי hardcoded secrets בקוד

שלב 7: תיעוד
├─ [ ] הוספתי Security Notice ל-README
└─ [ ] יצרתי SECURITY.md

שלב 8: בדיקה סופית
├─ [ ] git status נקי
├─ [ ] לוקאלי עובד
└─ [ ] ענן עובד

🎉 READY FOR PUBLIC RELEASE!
```

---

## 🚨 אם שכחת משהו?

**לא נורא!** אפשר לתקן בכל שלב:

1. **מצאת secret בגיט?** → השתמש ב-BFG לניקוי
2. **רוטציית key לא עבדה?** → בדוק logs בRender
3. **משהו נשבר?** → שלח לי את השגיאה!

---

**Checklist זה נוצר**: 2025-11-16
**גרסה**: 1.0
**סטטוס**: ✅ מוכן לשימוש
