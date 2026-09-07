# Firestore cutover checklist

## Prerequisites

1. Backfill working year on Mongo (if not done):

```bash
cd api
node scripts/backfill-working-year.js --year=2025
```

2. Firebase project `fast-accounting-5fd20` with Firestore enabled.
3. Service account JSON with Firestore write access.
4. Env vars on API:

```env
DATA_STORE=mongo
MONGODB_URI=...
FIREBASE_PROJECT_ID=fast-accounting-5fd20
# one of:
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccount.json
# or
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Optional client web config (only if you add client SDK later — do **not** commit secrets):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=fast-accounting-5fd20.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fast-accounting-5fd20
VITE_FIREBASE_STORAGE_BUCKET=fast-accounting-5fd20.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Dry-run / preview migration

```bash
cd api
npm run migrate:firestore:preview
# hoặc:
node scripts/mongo-to-firestore.js --preview --year=2025
```

> **Lưu ý:** đừng dùng `npm run ... -- --dry-run` — npm có thể nuốt `--dry-run`. Dùng `--preview`.

## Cutover

1. Announce short freeze / readonly window.
2. Final export/migrate:

```bash
node scripts/mongo-to-firestore.js --year=2025
```

3. Compare printed Mongo vs Firestore counts (customers, transactions).
4. Spot-check: one KH, one GD with `working_year`, admin user login hash present.
5. Set `DATA_STORE=firestore` on the API host (Vercel/env).
6. Restart API.
7. Smoke test:
   - [ ] Login ADMIN
   - [ ] Năm làm việc hiển thị / đổi năm
   - [ ] List GD chỉ theo năm đang chọn; KH + cấu hình (lãi suất, STK, thông báo…) dùng chung
   - [ ] Tạo GD ngày 2026 với năm làm việc 2025 → không hiện khi chọn 2026
   - [ ] Đổi năm làm việc → danh sách KH / cấu hình vẫn đầy đủ; chỉ số GD / nợ thay đổi theo năm
   - [ ] Upload ảnh Drive (vẫn dùng Drive)
   - [ ] Báo cáo PDF
   - [ ] Backup export (mongo path may be limited when on Firestore — verify)

8. Keep Mongo as readonly backup for several days, then revoke write URI.

## Rollback

Set `DATA_STORE=mongo` and restart API (Mongo still holds the pre-cutover data if freeze was respected).
