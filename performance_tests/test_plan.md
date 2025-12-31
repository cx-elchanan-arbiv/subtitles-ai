# P1 Performance Testing Plan
## Video: https://www.youtube.com/watch?v=wpHvBrIIJnA

## Test Scenarios:

### Test 1: Baseline (לפני P1)
**Configuration:**
- Sequential processing: transcription → translation
- Using asyncio (original code)
- No pipeline overlap

**Expected:** ~148s (65s transcription + 66s translation + 17s video)

---

### Test 2: P1 with asyncio.run + 4 threads
**Configuration:**
- TRANSLATION_PARALLELISM=4
- Using asyncio.run() (blocking issue)
- Pipeline overlap enabled

**Expected:** ~120s (asyncio.run blocks threads)

---

### Test 3: P1 sync + 1 thread (Current)
**Configuration:**
- TRANSLATION_PARALLELISM=1
- No asyncio (pure sync)
- Pipeline overlap enabled

**Expected:** ~90-95s (pipeline overlap saves ~35-40s)

---

### Test 4: P1 sync + 4 threads (Optimal)
**Configuration:**
- TRANSLATION_PARALLELISM=4
- No asyncio (pure sync)
- Pipeline overlap + concurrent batches

**Expected:** ~70-80s (best performance)

---

## Metrics to Track:
1. Total processing time
2. Transcription time
3. Translation time
4. Batch processing times
5. Number of concurrent batches (inflight)
6. Thread IDs used
7. API response times

## Test Execution Order:
1. ✅ Test 3 (current state)
2. ✅ Test 4 (change PARALLELISM to 4)
3. 🔄 Test 1 (revert to baseline - need git checkout)
4. 🔄 Test 2 (restore asyncio.run - need git history)
