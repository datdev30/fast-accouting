# Validation và Edge Cases - FastAccounting Tablet App

## 📋 Tổng Quan

Tài liệu này mô tả các validation và xử lý edge cases đã được implement trong ứng dụng tablet.

## ✅ Validation Đã Implement

### 1. Customers Form (`Customers.jsx`)

#### Name Field
- ✅ **Required**: Tên khách hàng là bắt buộc
- ✅ **Min Length**: Tối thiểu 2 ký tự
- ✅ **Max Length**: Tối đa 100 ký tự
- ✅ **Trim**: Tự động loại bỏ khoảng trắng đầu/cuối
- ✅ **Error Display**: Hiển thị lỗi với icon và màu đỏ
- ✅ **ARIA**: `aria-invalid` và `aria-describedby` cho accessibility

#### Contact Info Field
- ✅ **Max Length**: Tối đa 200 ký tự
- ✅ **Optional**: Không bắt buộc
- ✅ **Trim**: Tự động loại bỏ khoảng trắng đầu/cuối
- ✅ **Error Display**: Hiển thị lỗi khi vượt quá giới hạn

#### Transaction Edit (trong Customers modal)
- ✅ **Date Validation**: Kiểm tra ngày thanh toán >= ngày giao dịch
- ✅ **Invalid Date Check**: Kiểm tra `isNaN(date.getTime())`
- ⚠️ **Amount Validation**: Chưa có validation min/max rõ ràng trong form edit transaction

### 2. Transactions Form (`Transactions.jsx`)

#### Amount Field
- ✅ **Required**: Số tiền là bắt buộc
- ✅ **Min Value**: Phải lớn hơn 0
- ✅ **Number Only**: Chỉ cho phép nhập số (filter qua `replace(/,/g, '')`)
- ✅ **Format**: Tự động format với dấu phẩy khi hiển thị
- ⚠️ **Max Value**: Chưa có giới hạn tối đa rõ ràng (999,999,999,999 như client)

#### Customer Field
- ✅ **Required**: Phải chọn khách hàng
- ✅ **Validation**: Kiểm tra customer_id có tồn tại
- ✅ **Combobox**: Có search và keyboard navigation

#### Content Field
- ✅ **Required**: Nội dung là bắt buộc
- ✅ **Min Length**: Tối thiểu 3 ký tự
- ✅ **Trim**: Loại bỏ khoảng trắng đầu/cuối
- ⚠️ **Max Length**: Chưa có giới hạn tối đa

#### Date Validation
- ✅ **Transaction Date**: Kiểm tra hợp lệ
- ✅ **Paid Date**: Kiểm tra hợp lệ khi status = PAID
- ✅ **Date Comparison**: Ngày thanh toán >= Ngày giao dịch
- ✅ **Invalid Date Check**: Kiểm tra `isNaN(date.getTime())`

#### File Upload
- ✅ **File Size**: Tối đa 5MB
- ✅ **Error Handling**: Hiển thị lỗi khi file quá lớn
- ✅ **Type Validation**: Chỉ chấp nhận ảnh (qua imagePicker)
- ✅ **Partial Success**: Tạo transaction thành công nhưng upload ảnh lỗi
- ✅ **Retry Logic**: Có retry mechanism cho image loading (4 retries với exponential backoff)

### 3. Interest Configs Form (`InterestConfigs.jsx`)

#### Code Field
- ✅ **Required**: Mã là bắt buộc
- ✅ **Min Length**: 2 ký tự
- ✅ **Max Length**: 20 ký tự
- ✅ **Format**: Chỉ chữ in hoa, số và dấu gạch dưới (`/^[A-Z0-9_]+$/`)
- ✅ **Auto Uppercase**: Tự động chuyển sang chữ in hoa
- ✅ **Trim**: Loại bỏ khoảng trắng
- ✅ **Disabled on Edit**: Không cho sửa khi đang edit

#### Name Field
- ✅ **Required**: Tên hiển thị là bắt buộc
- ✅ **Min Length**: 2 ký tự
- ✅ **Max Length**: 100 ký tự (đã cập nhật từ 50)
- ✅ **Trim**: Loại bỏ khoảng trắng

#### Rate Field
- ✅ **Required**: Lãi suất là bắt buộc
- ✅ **Min Value**: >= 0 (không được âm)
- ✅ **Max Value**: <= 100%
- ✅ **Number Validation**: Kiểm tra `isNaN`
- ✅ **Step**: 0.1 (cho phép số thập phân)
- ✅ **Input Constraints**: `min="0" max="100"` trên input

### 4. User Management Form (`UserManagement.jsx`)

#### Username Field
- ✅ **Required**: Username là bắt buộc (khi tạo mới)
- ✅ **Min Length**: 3 ký tự
- ✅ **Max Length**: 50 ký tự (đã cập nhật từ 30)
- ✅ **Format**: Chỉ chữ, số và dấu gạch dưới (`/^[a-zA-Z0-9_]+$/`)
- ✅ **Trim**: Loại bỏ khoảng trắng
- ✅ **Disabled on Edit**: Không cho sửa khi đang edit

#### Password Field
- ✅ **Required**: Mật khẩu là bắt buộc (khi tạo mới)
- ✅ **Min Length**: 6 ký tự (đã cập nhật từ 4)
- ✅ **Max Length**: 100 ký tự
- ✅ **Optional**: Khi edit (chỉ validate nếu có nhập)

#### PIN Field
- ✅ **Format**: Phải là 4 chữ số (`/^\d{4}$/`) - **ĐÃ THỐNG NHẤT VỚI CLIENT**
- ✅ **Optional**: Không bắt buộc
- ✅ **Trim**: Loại bỏ khoảng trắng
- ✅ **Input Filter**: Chỉ cho phép số (`replace(/\D/g, '')`) và giới hạn 4 ký tự

### 5. Bulk Pay Form (`CustomerDebtDetail.jsx`)

#### PIN Field
- ✅ **Required**: PIN là bắt buộc
- ✅ **Format**: Phải là 4 chữ số
- ✅ **Trim**: Loại bỏ khoảng trắng
- ✅ **Error Display**: Hiển thị lỗi riêng cho PIN
- ✅ **Input Filter**: Chỉ cho phép số (`replace(/\D/g, '')`)
- ✅ **Validation on Blur**: Validate khi blur nếu đã nhập

#### Date Field
- ✅ **Required**: Ngày thanh toán là bắt buộc
- ✅ **Date Validation**: Kiểm tra `isNaN(date.getTime())`
- ✅ **Error Display**: Hiển thị lỗi khi không hợp lệ

## 🛡️ Edge Cases Đã Xử Lý

### 1. Null/Undefined Handling

#### Data Safety
- ✅ **Optional Chaining**: Sử dụng `?.` và `??` để tránh lỗi
- ✅ **Default Values**: Sử dụng `|| 0`, `|| ''` cho các giá trị mặc định
- ✅ **Array Checks**: Kiểm tra `Array.isArray()` trước khi iterate
- ✅ **Object Checks**: Kiểm tra `transactions` tồn tại trước khi tính toán

#### Examples:
```javascript
// CustomerDebtDetail.jsx
const principal = tx.amount || 0;
const interest = tx.interest_calculation?.rounded_interest || 0;
if (transactions && Array.isArray(transactions)) { ... }

// Transactions.jsx
const content = formData.content?.trim() || '';
if (!transactions || !Array.isArray(transactions)) return {};
```

### 2. Empty States

- ✅ **No Data**: Hiển thị EmptyState component khi không có dữ liệu
- ✅ **No Results**: Hiển thị khi filter không có kết quả
- ✅ **Loading States**: Skeleton loaders khi đang tải
- ✅ **Error States**: Network error với retry button

### 3. Network Errors

- ✅ **API Errors**: Hiển thị error message từ server
- ✅ **Network Timeout**: Xử lý qua React Query retry với exponential backoff
- ✅ **401 Unauthorized**: Tự động redirect về login (qua AuthContext)
- ✅ **Error Display**: Toast notifications và error states
- ✅ **Retry Logic**: Có retry cho image loading với exponential backoff
- ✅ **Offline Detection**: NetworkStatusContext phát hiện mất mạng
- ✅ **Offline Banner**: Hiển thị banner thông báo khi offline
- ✅ **Network Error Detection**: API interceptor phát hiện network errors
- ✅ **Auto Retry**: React Query tự động retry khi back online

### 4. Form Submission Edge Cases

- ✅ **Double Submit Prevention**: Disable button khi đang submit
- ✅ **Loading State**: Hiển thị "Đang xử lý..." khi pending
- ✅ **Error Recovery**: Clear errors khi user thay đổi input
- ✅ **Success Handling**: Reset form sau khi thành công
- ✅ **Create Another**: Có option để tạo tiếp (Transactions)

### 5. Input Sanitization

- ✅ **Trim Whitespace**: Tự động trim cho text inputs
- ✅ **Number Formatting**: Format số với dấu phẩy
- ✅ **Uppercase**: Auto uppercase cho code fields
- ✅ **Special Characters**: Filter chỉ cho phép ký tự hợp lệ
- ✅ **Numeric Input**: Filter non-numeric cho PIN và amount

### 6. Date Edge Cases

- ✅ **Invalid Dates**: Kiểm tra `isNaN(date.getTime())`
- ✅ **Date Comparison**: So sánh ngày thanh toán với ngày giao dịch
- ✅ **Future Dates**: Cho phép (không restrict)
- ✅ **Date Format**: Sử dụng ISO format (`YYYY-MM-DD`)
- ✅ **Group Invalid Dates**: Gộp các transaction có date invalid vào nhóm "Khác"

### 7. File Upload Edge Cases

- ✅ **File Size**: Validate 5MB limit
- ✅ **File Type**: Chỉ chấp nhận ảnh (qua imagePicker)
- ✅ **Upload Error**: Hiển thị lỗi riêng cho upload
- ✅ **Partial Success**: Tạo transaction thành công nhưng upload ảnh lỗi
- ✅ **Image Loading**: Lazy load image chỉ khi user click xem
- ✅ **Image Retry**: Retry mechanism với exponential backoff (4 lần)
- ✅ **Blob Cleanup**: Revoke object URL khi không dùng

### 8. Calculation Edge Cases

- ✅ **Division by Zero**: Không có phép chia
- ✅ **NaN Handling**: Sử dụng `|| 0` để tránh NaN
- ✅ **Infinity**: Kiểm tra `Number.isFinite()` trong formatMoneyComma
- ✅ **Large Numbers**: Format với toLocaleString
- ✅ **Null Amounts**: Xử lý `tx.amount || 0`

### 9. Image Handling Edge Cases

- ✅ **Lazy Loading**: Chỉ load khi user mở viewer
- ✅ **404 Handling**: Xử lý khi image không tồn tại
- ✅ **Retry Logic**: Retry với exponential backoff cho 404/502
- ✅ **Blob Validation**: Kiểm tra blob trước khi download PDF
- ✅ **Memory Management**: Revoke object URL khi không dùng

### 10. PDF Download Edge Cases

- ✅ **Blob Validation**: Kiểm tra blob instance và size
- ✅ **Empty File Check**: Kiểm tra blob.size === 0
- ✅ **Type Validation**: Kiểm tra blob type
- ✅ **Multiple Downloads Prevention**: Disable button khi đang download
- ✅ **Platform Detection**: Thông báo khác nhau cho Android vs Web

## ⚠️ Các Vấn Đề Cần Xem Lại

### 1. Inconsistency với Client

#### PIN Length
- ✅ **ĐÃ THỐNG NHẤT**: Tất cả PIN đều là 4 chữ số (UserManagement và BulkPay)

#### Amount Max Value
- ⚠️ **Transactions**: Chưa có max value validation rõ ràng
- **Khuyến nghị**: Thêm max value validation (999,999,999,999) như client

#### Content Max Length
- ⚠️ **Transactions**: Chưa có max length cho content
- **Khuyến nghị**: Thêm max length validation (ví dụ: 1000 ký tự)

### 2. Missing Validations

#### Transactions Form
- ⚠️ **Amount Max**: Chưa có validation max value
- ⚠️ **Content Max Length**: Chưa có giới hạn tối đa
- ⚠️ **Transaction Date Future**: Chưa có validation cho date quá xa trong tương lai (nếu cần)

#### CustomerDebtDetail
- ⚠️ **Bulk Date Validation**: Chưa validate bulkDate có hợp lệ không (chỉ required)
- ⚠️ **Bulk Date Comparison**: Chưa so sánh bulkDate với transaction dates

### 3. Edge Cases Còn Thiếu

#### Concurrent Requests
- ⚠️ Chưa có debounce cho search
- ⚠️ Chưa có request cancellation khi component unmount (React Query tự xử lý một phần)

#### Offline Handling
- ✅ **Offline Detection**: NetworkStatusContext với navigator.onLine và network check
- ✅ **Offline Banner**: Hiển thị banner khi mất mạng với nút retry
- ✅ **API Error Detection**: Interceptor phát hiện network errors và cập nhật status
- ✅ **Retry Mechanism**: React Query retry với exponential backoff
- ✅ **Auto Refetch**: Tự động refetch khi back online (refetchOnReconnect, refetchOnWindowFocus)
- ✅ **Network Status Events**: Custom events để sync network status giữa API và context

#### Large Data Sets
- ⚠️ Chưa có pagination cho transactions list
- ⚠️ Chưa có virtual scrolling (đã thử nhưng bỏ do UX không mượt)

#### Performance Edge Cases
- ⚠️ Chưa có memoization cho expensive calculations (đã có useMemo cho một số)
- ⚠️ Chưa có lazy loading cho components lớn

### 4. Potential Issues

#### Date Validation
- ⚠️ **Bulk Pay Date**: Chưa validate bulkDate format và range
- ⚠️ **Date Range Filter**: Chưa validate startDate < endDate

#### Number Validation
- ⚠️ **Amount Parsing**: Có thể có issue với số quá lớn (cần test)
- ⚠️ **Rate Parsing**: parseFloat có thể mất precision với số thập phân dài

#### Image Upload
- ⚠️ **Multiple Files**: Chưa handle trường hợp user chọn nhiều file
- ⚠️ **File Type**: Chỉ validate qua imagePicker, chưa validate trực tiếp file.type

## 📝 Validation Patterns

### Client-Side Validation
1. **Real-time**: Clear error khi user thay đổi input
2. **On Submit**: Validate tất cả fields trước khi submit
3. **Visual Feedback**: Border đỏ, error message, icon
4. **Accessibility**: ARIA labels và describedby

### Error Messages
- **Clear**: Mô tả rõ ràng lỗi gì
- **Actionable**: Hướng dẫn cách sửa
- **Vietnamese**: Tất cả messages bằng tiếng Việt
- **Consistent**: Format nhất quán

## 📊 Validation Coverage

| Form | Required Fields | Length Validation | Format Validation | Edge Cases | Status |
|------|----------------|-------------------|-------------------|------------|--------|
| Customers | ✅ | ✅ | ⚠️ | ✅ | ✅ Good |
| Transactions | ✅ | ⚠️ | ✅ | ✅ | ⚠️ Needs Max |
| Interest Configs | ✅ | ✅ | ✅ | ✅ | ✅ Excellent |
| User Management | ✅ | ✅ | ✅ | ✅ | ✅ Excellent |
| Bulk Pay | ✅ | ✅ | ✅ | ⚠️ | ⚠️ Date Validation |

**Legend:**
- ✅ = Fully implemented
- ⚠️ = Partially implemented or needs improvement
- ❌ = Not implemented

## 🎯 Best Practices Đã Áp Dụng

1. ✅ **Defensive Programming**: Luôn kiểm tra null/undefined
2. ✅ **User Feedback**: Toast notifications cho mọi action
3. ✅ **Error Boundaries**: React Query error handling
4. ✅ **Accessibility**: ARIA labels, keyboard navigation
5. ✅ **Type Safety**: Validate input types trước khi sử dụng
6. ✅ **Normalization**: Trim và normalize data trước khi submit
7. ✅ **Memory Management**: Revoke object URLs
8. ✅ **Retry Logic**: Exponential backoff cho image loading
9. ✅ **Offline Handling**: Network status detection và auto-retry
10. ✅ **Network Status UI**: Offline banner với retry button

## 🔧 Khuyến Nghị Cải Thiện

### Priority 1 (Quan trọng)
1. ✅ **Thống nhất PIN length**: ĐÃ HOÀN THÀNH - Tất cả PIN đều là 4 chữ số
2. **Thêm Amount Max**: Thêm validation max value cho amount (999,999,999,999)
3. **Thêm Content Max Length**: Thêm validation max length cho content (1000 ký tự)
4. **Bulk Date Validation**: Validate bulkDate format và so sánh với transaction dates

### Priority 2 (Nên có)
1. **Date Range Validation**: Validate startDate < endDate trong filters
2. **Debounce Search**: Thêm debounce cho search inputs
3. **File Type Validation**: Validate file.type trực tiếp, không chỉ qua imagePicker

### Priority 3 (Nice to have)
1. ✅ **Offline Detection**: ĐÃ HOÀN THÀNH - NetworkStatusContext với offline detection và retry mechanism
2. **Pagination**: Thêm pagination cho transactions list
3. **Virtual Scrolling**: Thêm virtual scrolling cho danh sách dài

---

**Last Updated**: 2024
**Status**: Production Ready với một số improvements cần thiết
**Comparison**: Tương đương với client, có một số điểm cần cải thiện
