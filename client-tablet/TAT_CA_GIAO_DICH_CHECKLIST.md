# ✅ Checklist: Tính năng "Tất cả giao dịch" - Màn hình Chi tiết công nợ

## 📋 Tổng quan
Thêm button "Tất cả giao dịch" vào màn hình Chi tiết công nợ, cho phép in và tải xuống PDF tất cả giao dịch của khách hàng (bao gồm cả đã trả và đang nợ). Giao dịch đã trả sẽ có background màu vàng nhạt.

## ✅ Frontend (client-tablet)

### 1. UI Components
- [x] Thêm button "Tất cả giao dịch" vào header (portrait và landscape)
- [x] Tạo state `showAllTransactionsPreview` để quản lý modal preview
- [x] Tạo component `PrintableAllTransactions.jsx` hiển thị tất cả giao dịch
- [x] Thiết kế modal preview cho portrait và landscape
- [x] Thêm background màu vàng nhạt cho giao dịch đã trả trong component

### 2. API Integration
- [x] Tạo function `downloadAllTransactionsPdf` trong `api.js`
- [x] Thêm handler `handleDownloadAllTransactionsPdf` 
- [x] Thêm handler `handlePrintAllTransactions` cho in trực tiếp
- [x] Import `downloadAllTransactionsPdf` vào `CustomerDebtDetail.jsx`

### 3. Features
- [x] Button "Tất cả giao dịch" hiển thị trong header
- [x] Modal preview với scrollable content
- [x] Nút "Tải xuống" PDF
- [x] Nút "In ngay" để in trực tiếp
- [x] Hiển thị giao dịch đã trả với background vàng nhạt (#fefce8)
- [x] Hiển thị tổng hợp: Tổng tất cả, Đã thanh toán, Còn nợ lại

## ⚠️ Backend (api) - CẦN CẬP NHẬT

### 1. API Endpoint
- [ ] Cập nhật endpoint `/api/reports/:customer_id/pdf` để hỗ trợ param `include_all`
- [ ] Khi `include_all=true`, trả về tất cả giao dịch (bao gồm cả PAID)
- [ ] Khi `include_all=false` hoặc không có, chỉ trả về giao dịch OPEN (giữ nguyên logic hiện tại)

### 2. PDF Generation
- [ ] Cập nhật hàm `generatePDF` trong `api/utils/pdf.js`:
  - [ ] Nhận thêm param `includeAll` (boolean)
  - [ ] Khi `includeAll=true`, không filter theo status (hiển thị cả PAID và OPEN)
  - [ ] Thêm background màu vàng nhạt (#fefce8) cho các dòng giao dịch có `status === 'PAID'`
  - [ ] Cập nhật tiêu đề PDF: "TẤT CẢ GIAO DỊCH" thay vì "PHIẾU THANH TOÁN CÔNG NỢ"
  - [ ] Cập nhật phần tổng hợp để hiển thị:
    - Tổng tiền gốc (tất cả)
    - Tổng tiền lãi (tất cả)
    - Tổng tiền (tất cả)
    - Đã thanh toán (gốc + lãi)
    - Còn nợ lại (gốc + lãi)

### 3. Code Changes Cần Thiết

#### File: `api/routes/reports.js`
```javascript
// Cập nhật endpoint GET /:customer_id/pdf
router.get('/:customer_id/pdf', async (req, res) => {
    const { include_all } = req.query;
    const includeAll = include_all === 'true';
    
    // ... existing code ...
    
    // Generate PDF với param includeAll
    const pdfBuffer = await generatePDF(customer, transactions, includeAll);
    
    // Cập nhật filename
    const filename = includeAll 
        ? `Tat_ca_giao_dich_${safeName}.pdf`
        : `Phieu_TTCN_${safeName}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
});
```

#### File: `api/utils/pdf.js`
```javascript
// Cập nhật signature function
export async function generatePDF(customer, transactions, includeAll = false) {
    // ... existing code ...
    
    // Thay đổi title
    const title = includeAll 
        ? 'TẤT CẢ GIAO DỊCH'
        : 'PHIẾU THANH TOÁN CÔNG NỢ';
    
    // Thay đổi logic group transactions
    const groups = {};
    for (const tx of transactions) {
        // Nếu includeAll = false, chỉ lấy OPEN (giữ nguyên)
        if (!includeAll && tx.status !== 'OPEN') continue;
        
        const monthKey = `${(tx.transaction_date.getMonth() + 1).toString().padStart(2, '0')}/${tx.transaction_date.getFullYear()}`;
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(tx);
    }
    
    // Trong vòng lặp vẽ rows, thêm background cho PAID transactions
    for (const tx of txs) {
        const isPaid = tx.status === 'PAID';
        const fillColor = isPaid ? '#fefce8' : null;
        
        // Vẽ row với fill color nếu là PAID
        drawCell(doc, xPos, rowY, layout.colWidths[0], rowHeight, dateCell, {
            align: 'center',
            padX, padY,
            fontSize: 10,
            fill: fillColor  // Thêm fill color
        });
        // ... repeat for all cells in the row
    }
    
    // Cập nhật phần tổng hợp nếu includeAll = true
    if (includeAll) {
        // Tính toán totals cho tất cả, đã trả, và còn nợ
        // Hiển thị theo format mới
    }
}
```

## 🧪 Testing

### Frontend Testing
- [ ] Test button "Tất cả giao dịch" hiển thị đúng trong portrait
- [ ] Test button "Tất cả giao dịch" hiển thị đúng trong landscape
- [ ] Test modal preview mở và đóng đúng
- [ ] Test hiển thị giao dịch đã trả với background vàng nhạt
- [ ] Test nút "Tải xuống" PDF
- [ ] Test nút "In ngay"
- [ ] Test responsive design cho cả portrait và landscape

### Backend Testing
- [ ] Test endpoint với `include_all=true` trả về tất cả giao dịch
- [ ] Test endpoint với `include_all=false` chỉ trả về OPEN (backward compatible)
- [ ] Test PDF có background vàng nhạt cho giao dịch đã trả
- [ ] Test PDF có tiêu đề đúng ("TẤT CẢ GIAO DỊCH")
- [ ] Test PDF có tổng hợp đầy đủ (tất cả, đã trả, còn nợ)

## 📝 Notes

1. **Backward Compatibility**: Endpoint hiện tại vẫn hoạt động bình thường khi không có param `include_all`
2. **Color**: Background vàng nhạt sử dụng màu `#fefce8` (tương đương Tailwind `bg-yellow-50`)
3. **File Naming**: PDF tải xuống sẽ có tên `Tat_ca_giao_dich_<customer_name>.pdf` khi `include_all=true`
4. **UI/UX**: Modal preview giống với modal "In Phiếu Nợ" để đảm bảo consistency

## 🚀 Deployment

1. Deploy frontend changes trước
2. Deploy backend changes sau
3. Test end-to-end sau khi deploy
4. Verify PDF generation hoạt động đúng trên cả web và native (Android/iOS)
