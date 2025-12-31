# מדריך הרצת טסטים ידני 🧪

## המצב הנוכחי ✅

המערכת כרגע מוגדרת במצב:
- **P1 sync + 1 thread** (Pipeline overlap עם worker אחד)
- `TRANSLATION_PARALLELISM=1`
- `MAX_CONCURRENT_OPENAI_REQUESTS=1`
- ✅ ללא asyncio.run() (synchronous)
- ✅ Pipeline overlap מופעל

## איך להריץ טסטים

### Test 3: P1 sync + 1 thread (מצב נוכחי)

1. **המערכת כבר רצה** - http://localhost
2. **העלה את הסרטון**: https://www.youtube.com/watch?v=wpHvBrIIJnA
3. **אסוף לוגים בזמן אמת**:
```bash
docker-compose logs -f worker | tee performance_tests/results/test3_logs.txt
```
4. **חכה שהטסט יסתיים**
5. **לחץ Ctrl+C** כדי לעצור את הלוגים

---

### Test 4: P1 sync + 4 threads

1. **עצור את המערכת**:
```bash
docker-compose down
```

2. **שנה ב-docker-compose.yml**:
```yaml
- TRANSLATION_PARALLELISM=4
- MAX_CONCURRENT_OPENAI_REQUESTS=4
```

3. **הפעל מחדש**:
```bash
docker-compose up -d
```

4. **העלה את הסרטון**: https://www.youtube.com/watch?v=wpHvBrIIJnA

5. **אסוף לוגים**:
```bash
docker-compose logs -f worker | tee performance_tests/results/test4_logs.txt
```

6. **חכה שהטסט יסתיים**
7. **לחץ Ctrl+C**

---

## מה לחפש בלוגים

### מדדים חשובים:

1. **זמן כולל**:
```
🎉 Pipeline complete! Total time: XXs
```

2. **זמני batch**:
```
📊 Phase A+ Batch operation completed ... duration_s=XX
```

3. **Threads במקביל**:
```
🔄 [Thread-XXXXXX] Translating batch #X
```

4. **Max concurrent batches**:
```
📤 Submitting batch #X to thread pool (inflight=X)
```

---

## ניתוח מהיר

### Test 3 (1 thread):
- צפוי: ~90-95s
- Batches ברצף (inflight=0,1)
- Thread אחד

### Test 4 (4 threads):
- צפוי: ~70-80s
- Batches במקביל (inflight=2,3,4)
- 4 threads שונים

---

## שחזור למצב נוכחי

אם שינית ל-4 threads, תחזיר ל-1:

```bash
# במקור הפרויקט
docker-compose down

# ערוך docker-compose.yml:
# TRANSLATION_PARALLELISM=1
# MAX_CONCURRENT_OPENAI_REQUESTS=1

docker-compose up -d
```

---

## קבצי תוצאות

הלוגים יישמרו ב:
- `performance_tests/results/test3_logs.txt`
- `performance_tests/results/test4_logs.txt`

תוכל לנתח אותם מאוחר יותר!
