# 📊 Statistics JSONL Guide - נתונים גולמיים לניתוח

## מה השתנה?

כעת המערכת שומרת **כל סרטון כשורה נפרדת** בקובץ JSONL לניתוח מעמיק! 🎉

---

## TL;DR - תקציר

✅ **כל סרטון = שורה אחת** בקובץ `/app/stats/video_stats.jsonl`
✅ **נשמר לתמיד** (persistent disk)
✅ **Redis + File** - שניהם יחד!
✅ **Download API** - `GET /api/stats/download`
✅ **סקריפט ניתוח** - `analyze_stats.py` מוכן

---

## מבנה הקובץ

### דוגמה - 3 סרטונים:

```jsonl
{"task_id":"abc123","video_duration":60,"video_size_mb":25.5,"transcription_model":"base","source_lang":"en","target_lang":"he","transcription_duration":20.5,"transcription_speed_ratio":2.93,"translation_service":"openai","translation_duration":5.2,"translation_tokens":0,"translation_cost_usd":0.0,"embedding_duration":10.1,"total_duration":35.8,"status":"success","error_message":null,"timestamp":"2025-11-19T10:30:00","created_at":"2025-11-19T10:30:00"}
{"task_id":"def456","video_duration":180,"video_size_mb":67.2,"transcription_model":"medium","source_lang":"en","target_lang":"he","transcription_duration":65.3,"transcription_speed_ratio":2.76,"translation_service":"openai","translation_duration":12.1,"translation_tokens":0,"translation_cost_usd":0.0,"embedding_duration":25.4,"total_duration":102.8,"status":"success","error_message":null,"timestamp":"2025-11-19T11:15:00","created_at":"2025-11-19T11:15:00"}
{"task_id":"ghi789","video_duration":45,"video_size_mb":18.3,"transcription_model":"base","source_lang":"es","target_lang":"he","transcription_duration":15.2,"transcription_speed_ratio":2.96,"translation_service":"openai","translation_duration":3.8,"translation_tokens":0,"translation_cost_usd":0.0,"embedding_duration":7.1,"total_duration":26.1,"status":"success","error_message":null,"timestamp":"2025-11-19T12:05:00","created_at":"2025-11-19T12:05:00"}
```

**כל שורה = JSON אחד של סרטון!**

---

## איך להוריד את הקובץ?

### אפשרות 1: curl (מהיר)

```bash
# הורד את הקובץ
curl http://localhost:8081/api/stats/download > video_stats.jsonl

# בדוק כמה שורות יש
wc -l video_stats.jsonl

# הצג 3 שורות ראשונות (יפה)
head -3 video_stats.jsonl | jq
```

### אפשרות 2: Python

```python
import requests

response = requests.get('http://localhost:8081/api/stats/download')
with open('video_stats.jsonl', 'wb') as f:
    f.write(response.content)

print("✅ Downloaded!")
```

### אפשרות 3: דפדפן

פשוט תפתח: `http://localhost:8081/api/stats/download`

הדפדפן יוריד את הקובץ אוטומטית.

---

## ניתוח הנתונים

### אפשרות 1: סקריפט מוכן (מומלץ!)

```bash
# התקן dependencies
pip install pandas matplotlib seaborn requests

# הרץ ניתוח
python3 analyze_stats.py
```

**מה הסקריפט עושה:**
- ✅ מוריד את הקובץ אוטומטית
- ✅ מדפיס סיכום מפורט
- ✅ מציג ביצועים לפי מודל
- ✅ מוצא outliers (סרטונים איטיים)
- ✅ מייצר גרפים (`stats_analysis.png`)
- ✅ מייצא ל-CSV (`video_stats.csv`)

---

### אפשרות 2: pandas ישיר

```python
import pandas as pd

# קרא את הקובץ
df = pd.read_json('video_stats.jsonl', lines=True)

# סיכום בסיסי
print(f"Total videos: {len(df)}")
print(f"Success rate: {len(df[df['status']=='success'])/len(df)*100:.1f}%")

# ממוצע לפי מודל
print(df.groupby('transcription_model')['total_duration'].mean())

# מהיר/איטי ביותר
print("Fastest:", df.nsmallest(1, 'total_duration')[['video_duration', 'total_duration']])
print("Slowest:", df.nlargest(1, 'total_duration')[['video_duration', 'total_duration']])

# חפש דפוס: וידאו של 60s לוקח כמה זמן?
videos_60s = df[(df['video_duration'] >= 55) & (df['video_duration'] <= 65)]
print(f"60s videos avg processing: {videos_60s['total_duration'].mean():.1f}s")

# הצג 10 ראשונות
print(df.head(10))

# סינון
base_model_videos = df[df['transcription_model'] == 'base']
print(f"Base model: {len(base_model_videos)} videos, avg: {base_model_videos['total_duration'].mean():.1f}s")
```

---

### אפשרות 3: Excel / Google Sheets

```bash
# המר ל-CSV
python3 -c "import pandas as pd; pd.read_json('video_stats.jsonl', lines=True).to_csv('stats.csv', index=False)"

# עכשיו פתח stats.csv ב-Excel
```

---

## שאילתות מעניינות

### 1. כמה זמן לוקח לעבד וידאו של 3 דקות?

```python
import pandas as pd
df = pd.read_json('video_stats.jsonl', lines=True)

# סינון: סרטונים בין 2:45 ל-3:15 (165-195 שניות)
videos_3min = df[(df['video_duration'] >= 165) & (df['video_duration'] <= 195)]

print(f"Videos ~3min: {len(videos_3min)}")
print(f"Avg processing time: {videos_3min['total_duration'].mean():.1f}s")
print(f"Avg speed ratio: {videos_3min['transcription_speed_ratio'].mean():.2f}x")

# פירוט לפי שלבים
print(f"  Transcription: {videos_3min['transcription_duration'].mean():.1f}s")
print(f"  Translation: {videos_3min['translation_duration'].mean():.1f}s")
print(f"  Embedding: {videos_3min['embedding_duration'].mean():.1f}s")
```

### 2. איזה מודל הכי מהיר?

```python
import pandas as pd
df = pd.read_json('video_stats.jsonl', lines=True)

comparison = df.groupby('transcription_model').agg({
    'total_duration': 'mean',
    'transcription_speed_ratio': 'mean',
    'video_duration': 'count'
}).rename(columns={'video_duration': 'count'})

print(comparison.sort_values('total_duration'))
```

### 3. יש outliers? (סרטונים איטיים בצורה חריגה)

```python
import pandas as pd
df = pd.read_json('video_stats.jsonl', lines=True)

# חשב ממוצע + סטיית תקן
mean = df['total_duration'].mean()
std = df['total_duration'].std()

# outliers = יותר מ-2 סטיות תקן מהממוצע
outliers = df[df['total_duration'] > mean + 2*std]

print(f"Found {len(outliers)} outliers:")
print(outliers[['video_duration', 'transcription_model', 'total_duration']])
```

### 4. מגמה לאורך זמן

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_json('video_stats.jsonl', lines=True)
df['date'] = pd.to_datetime(df['timestamp']).dt.date

# ממוצע יומי
daily = df.groupby('date')['total_duration'].mean()

# גרף
daily.plot(title='Average Processing Time Over Time')
plt.ylabel('Duration (s)')
plt.show()
```

---

## API Endpoints חדשים

| Endpoint | תיאור |
|----------|-------|
| `GET /api/stats/download` | הורד את כל הקובץ JSONL |
| `GET /api/stats/info` | מידע על הקובץ (גודל, מספר entries) |

### דוגמה - בדוק info לפני download:

```bash
curl http://localhost:8081/api/stats/info
```

```json
{
  "file_exists": true,
  "file_path": "/app/stats/video_stats.jsonl",
  "file_size_bytes": 15234,
  "file_size_kb": 14.88,
  "entry_count": 42
}
```

---

## איפה הקובץ נמצא?

### לוקלי (Docker):
```bash
# הקובץ בvolume:
docker-compose exec backend ls -lh /app/stats/

# העתק החוצה:
docker cp $(docker-compose ps -q backend):/app/stats/video_stats.jsonl ./
```

### פרודקשן (Render):
- ✅ Persistent disk `/app/stats` (1GB)
- ✅ נשמר בין deploy-ים
- ✅ גישה דרך API בלבד (`/api/stats/download`)

**חשוב:** אל תשכח להוסיף את הdisk ב-Render! (ראה `RENDER_DEPLOY.md`)

---

## גיבוי

### המלצה: backup שבועי

```bash
#!/bin/bash
# backup_stats.sh

DATE=$(date +%Y-%m-%d)
curl http://YOUR-BACKEND-URL/api/stats/download > "stats_backup_$DATE.jsonl"
echo "✅ Backup saved: stats_backup_$DATE.jsonl"
```

הוסף ל-cron:
```cron
0 2 * * 0 /path/to/backup_stats.sh
```

---

## שאלות נפוצות

### Q: למה JSONL ולא CSV?
**A:** JSONL גמיש יותר - אפשר להוסיף שדות בעתיד בלי לשבור את הקבצים הישנים.

### Q: כמה זמן הקובץ נשמר?
**A:** **לתמיד!** (עד שתמחק ידנית או הdisk ימלא)

### Q: מה ההבדל בין Redis לJSONL?
**A:**
- **Redis** = מהיר, real-time, נמחק אחרי 30 יום, טוב ל-API
- **JSONL** = קבוע, ארוך טווח, טוב לניתוח ו-ML

### Q: איך למחוק entries ישנים?
**A:** פתח את הקובץ ומחק שורות ידנית, או:
```python
import pandas as pd
from datetime import datetime, timedelta

df = pd.read_json('video_stats.jsonl', lines=True)
df['timestamp'] = pd.to_datetime(df['timestamp'])

# שמור רק 90 ימים אחרונים
cutoff = datetime.now() - timedelta(days=90)
df_recent = df[df['timestamp'] > cutoff]

df_recent.to_json('video_stats.jsonl', orient='records', lines=True)
```

### Q: אפשר לנתח בזמן אמת?
**A:** כן! תוריד את הקובץ כל כמה דקות ותריץ ניתוח:
```bash
# ב-cron כל 15 דקות
*/15 * * * * python3 /path/to/analyze_stats.py >> /var/log/stats_analysis.log
```

---

## מה הלאה?

1. **Dashboard** - בנה Grafana/Streamlit להצגה חיה
2. **ML** - חזה זמני עיבוד לפי אורך וידאו
3. **Alerts** - התראות על ביצועים חריגים
4. **BigQuery** - העלה ל-BigQuery לניתוח בענן

---

**✅ הכל מוכן! תתחיל לעבד סרטונים והנתונים יישמרו אוטומטית!**

נוצר: 2025-11-19
