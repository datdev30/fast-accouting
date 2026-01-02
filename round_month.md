# Thuật toán làm tròn tháng từ ngày bắt đầu và ngày kết thúc

Thuật toán này giúp tính số tháng giữa hai ngày (ngày bắt đầu và ngày kết thúc) và làm tròn kết quả theo các mức: **0 tháng**, **0.5 tháng**, và **1 tháng**.

### **Các bước thực hiện thuật toán**

#### **Ngày bắt đầu: Ngày vay tiền#### **Ngày kết thúc: Ngày trả tiền**

#### **Giả định một tháng là 30 ngày**

1. **Tính số ngày giữa ngày bắt đầu và ngày kết thúc**:
  - Tính tổng số ngày giữa hai ngày nhập vào (tính cả ngày bắt đầu và ngày kết thúc).

2. **Chia số ngày cho 30 để tính số tháng**:
   - Một tháng được giả định là **30 ngày**.
   - Chia số ngày cho 30 để tính số tháng thô (số tháng chưa làm tròn).

3. **Lấy phần dư**:
   - Tính phần dư sau khi chia số ngày cho 30. Phần dư này đại diện cho số ngày chưa đủ để hoàn thành một tháng.

4. **Làm tròn số tháng dựa trên phần dư**:
  - Nếu phần dư từ 1 đến 10 ngày, làm tròn xuống **0 tháng**.
  - Nếu phần dư từ 11 đến 20 ngày, làm tròn lên **0.5 tháng**.
  - Nếu phần dư từ 21 ngày trở lên, làm tròn lên **1 tháng**.

5. **Cộng phần dư vào số tháng đã tính**:
   - Sau khi làm tròn phần dư, cộng giá trị đó vào số tháng đã tính được để ra kết quả cuối cùng.

### **Các mức làm tròn phần dư**

- **1 - 10 ngày**: Làm tròn thành **0 tháng**.
- **11 - 20 ngày**: Làm tròn thành **0.5 tháng**.
- **Từ 21 ngày trở lên**: Làm tròn thành **1 tháng**.

### **Ví dụ**

1. **Ngày bắt đầu**: 1/10  
   **Ngày kết thúc**: 21/12

   - **Tính số ngày**:
     - Tháng 10: 31 ngày
     - Tháng 11: 30 ngày
     - Tháng 12: 21 ngày
     - Tổng số ngày = **31 + 30 + 21 = 82 ngày**

   - **Tính số tháng**:
     - 82 ngày ÷ 30 ngày/tháng = **2 tháng dư 22 ngày**

   - **Làm tròn phần dư**:
     - 22 ngày nằm trong khoảng từ 20 đến 30 ngày, do đó làm tròn thành **1 tháng**.

   - **Kết quả cuối cùng**:
     - 2 tháng + 1 tháng (do phần dư) = **3 tháng**.

2. **Ngày bắt đầu**: 1/10  
   **Ngày kết thúc**: 15/10

   - **Tính số ngày**: 15 ngày
   - **Tính số tháng**:
     - 15 ngày ÷ 30 ngày/tháng = **0 tháng dư 15 ngày**
   - **Làm tròn phần dư**:
    - 15 ngày nằm trong khoảng từ 11 đến 20 ngày, do đó làm tròn thành **0.5 tháng**.
   - **Kết quả cuối cùng**:
     - 0 tháng + 0.5 tháng = **0.5 tháng**.

3. **Ngày bắt đầu**: 1/10  
   **Ngày kết thúc**: 5/11

   - **Tính số ngày**:
     - Tháng 10: 31 ngày
     - Tháng 11: 5 ngày
     - Tổng số ngày = **31 + 5 = 36 ngày**
   - **Tính số tháng**:
     - 36 ngày ÷ 30 ngày/tháng = **1 tháng dư 6 ngày**
   - **Làm tròn phần dư**:
     - 6 ngày nằm trong khoảng từ 0 đến 10 ngày, do đó làm tròn thành **0 tháng**.
   - **Kết quả cuối cùng**:
     - 1 tháng + 0 tháng = **1 tháng**.