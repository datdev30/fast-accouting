# Backup / Restore (Kéo dữ liệu về máy + tải lên lại khi cấp thiết)

Mục tiêu: luôn có bản sao dữ liệu **tại máy** để khi DB online (Atlas/Vercel) gặp sự cố thì có thể **khôi phục nhanh** hoặc **nạp lại từng nhóm record**.

## 1) Chiến lược khuyến nghị (2 lớp)

### Lớp A — “Chuẩn bài” (nếu dùng MongoDB Atlas)
- Bật **Atlas Automated Backups / Snapshots** (theo gói cụm).
- Thiết lập lịch snapshot (daily) + retention (ví dụ 7–30 ngày tuỳ nhu cầu).
- Khi sự cố: restore snapshot ra 1 cluster/DB mới, rồi trỏ app về DB mới.

Ưu điểm: nhanh, an toàn, ít rủi ro thiếu dữ liệu.

### Lớp B — “Cấp cứu tại máy” (file backup nằm trong repo)
Dùng script Node để export toàn bộ collection ra file EJSON, lưu vào thư mục `api/backups/<timestamp>/`.

- Export định kỳ (hàng ngày/tuần) hoặc trước khi làm thay đổi lớn.
- Có thể mang folder backup sang máy khác và restore.

## 2) Backup dữ liệu về máy (Export)

### Yêu cầu
- Có `api/.env` chứa `MONGODB_URI` trỏ vào DB muốn backup.

### Lệnh
Chạy trong thư mục `api/`:

- Export ra thư mục backup mới theo timestamp:
  - `npm run backup:export`

- Hoặc export ra thư mục tự chọn:
  - `npm run backup:export -- --out D:\FastAccounting\_backups\prod_2026-01-02`

Kết quả tạo ra các file:
- `customers.ejson.json`
- `transactions.ejson.json`
- `interest_configs.ejson.json`
- `users.ejson.json`
- `counters.ejson.json`
- `backup.meta.ejson.json`

## 3) Restore (tải lên lại) khi có sự cố

### Mode 1 — UPSERT (an toàn, không xoá dữ liệu đang có)
Dùng khi DB còn chạy nhưng thiếu/thiệt hại một phần dữ liệu.

- `npm run backup:import -- --dir D:\FastAccounting\_backups\prod_2026-01-02`

Script sẽ **upsert theo `_id`** (có `_id` thì replace + upsert). Record nào đã tồn tại sẽ được cập nhật đúng theo bản backup.

### Mode 2 — DROP + RESTORE (nguy hiểm, xoá sạch rồi khôi phục)
Chỉ dùng khi bạn **chắc chắn** cần phục hồi toàn bộ DB.

- `npm run backup:import -- --dir D:\FastAccounting\_backups\prod_2026-01-02 --drop --force`

Cảnh báo: lệnh này sẽ xoá các collection trước khi restore.

## 4) Quy trình vận hành đề xuất (thực tế, dễ làm)

- Hàng ngày (hoặc mỗi lần chốt sổ): chạy `npm run backup:export`.
- Lưu backup ra một nơi an toàn (ổ khác/USB/Drive nội bộ có mã hoá nếu cần).
- Mỗi tuần kiểm tra thử restore vào 1 DB test để chắc chắn backup usable.

## 5) Gợi ý “cấp thiết” khi chỉ cần khôi phục một phần

Nếu chỉ mất 1 nhóm dữ liệu (ví dụ khách hàng/phiếu giao dịch), bạn vẫn có thể:
- dùng Mode UPSERT, nó sẽ nạp lại đúng những record có trong backup mà không cần xoá DB.

## 6) Lưu ý bảo mật

Backup có thể chứa dữ liệu nhạy cảm (khách hàng, lịch sử giao dịch, user). Nên:
- lưu ở thư mục chỉ người tin cậy truy cập;
- nếu gửi qua mạng, hãy nén và đặt mật khẩu.
