# 🚀 Quick Commands Reference

מדריך מהיר לפקודות הנפוצות במערכת.

## 🚨 **אזהרה חשובה לפני כל שינוי בקוד:**
**קרא את [CODE_MODIFICATION_POLICY.md](CODE_MODIFICATION_POLICY.md) לפני שינוי כלשהו!**

**זכור: תמיד שאל לפני שינוי!**

## 🏃‍♂️ תחילת עבודה מהירה

```bash
# התחל מחדש (אם המערכת כבר רצה):
./stop.sh && ./start.sh

# בדיקה מהירה שהכל עובד:
curl http://localhost:8081/health
curl http://localhost | head -1
```

## 🐳 Docker Commands

```bash
# סטטוס כל השירותים:
docker-compose ps

# הפעלה:
./start.sh

# עצירה:
./stop.sh

# לוגים בזמן אמת:
docker-compose logs -f backend
docker-compose logs -f worker

# כניסה לcontainer:
docker exec -it substranslator-backend-1 bash
```

## 🧪 Testing Commands

```bash
# טסט API ידני - YouTube:
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=DzjrqYn0do8","target_lang":"he","auto_create_video":true,"whisper_model":"tiny"}' \
  http://localhost:8081/youtube

# בדיקת סטטוס משימה:
curl http://localhost:8081/status/{TASK_ID}

# טסט יחידה:
docker exec substranslator-backend-1 python3 -m pytest /app/test_app.py -v

# העתק טסט לcontainer והרץ:
docker cp e2e_subtitle_test.py substranslator-backend-1:/app/
docker exec substranslator-backend-1 python3 /app/e2e_subtitle_test.py --url "https://www.youtube.com/watch?v=DzjrqYn0do8" --auto_create_video
```

## 🔍 Debugging Commands

```bash
# בדוק מי רץ:
docker ps
docker-compose ps

# לוגים של שירות ספציפי:
docker-compose logs backend --tail=20
docker-compose logs worker --tail=20
docker-compose logs frontend --tail=20

# בדוק נתיבים בcontainer:
docker exec substranslator-backend-1 ls -la /app/
docker exec substranslator-backend-1 ls -la /app/downloads/

# בדוק משתני סביבה:
docker exec substranslator-backend-1 env | grep -E "(CELERY|REDIS)"
```

## 🚨 Emergency Recovery

```bash
# עצירה כוחנית וניקוי מלא:
./stop.sh
docker stop $(docker ps -q --filter "name=substranslator")
docker rm $(docker ps -aq --filter "name=substranslator")
docker system prune -f

# התחלה מחדש נקייה:
./start.sh

# אם יש בעיות build:
docker system prune -a
./start.sh
```

## 📊 Monitoring Commands

```bash
# בדוק שימוש במשאבים:
docker stats

# בדוק גודל קבצים שנוצרו:
docker exec substranslator-backend-1 ls -lh /app/downloads/

# בדוק כמות קבצים:
docker exec substranslator-backend-1 find /app/downloads/ -type f | wc -l

# נקה קבצים ישנים (זהירות!):
docker exec substranslator-backend-1 find /app/downloads/ -type f -mtime +7 -delete
```

## 🔧 Development Commands

```bash
# עדכון קוד ו-restart:
./stop.sh
git pull
./start.sh

# בדיקת שינויים בקוד:
git status
git diff

# צפייה בקבצים שנוצרו:
docker exec substranslator-backend-1 tail -f /app/downloads/*.log

# בדיקת configuration:
docker exec substranslator-backend-1 cat /app/config.py
```

## 📈 Performance Testing

```bash
# טסט עומס פשוט:
for i in {1..3}; do
  curl -X POST -H "Content-Type: application/json" \
    -d '{"url":"https://www.youtube.com/watch?v=DzjrqYn0do8","target_lang":"he","auto_create_video":false,"whisper_model":"tiny"}' \
    http://localhost:8081/youtube &
done

# מעקב אחר worker:
docker-compose logs -f worker
```

## 🎯 Quick Fixes

### Frontend לא נטען:
```bash
curl http://localhost
docker-compose logs frontend
```

### Backend לא מגיב:
```bash
curl http://localhost:8081/health
docker-compose logs backend
```

### Worker לא עובד:
```bash
docker-compose logs worker
docker exec substranslator-backend-1 celery -A celery_worker inspect active
```

### Redis בעיות:
```bash
docker-compose logs redis
docker exec substranslator-backend-1 redis-cli ping
```

---

**💡 טיפ: שמור את הקובץ הזה פתוח בזמן פיתוח!**
