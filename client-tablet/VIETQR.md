# 📱 Hướng dẫn Sử dụng VietQR API - Tạo mã QR thanh toán

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Đăng ký và Lấy thông tin xác thực](#đăng-ký-và-lấy-thông-tin-xác-thực)
3. [Cấu hình môi trường (.env)](#cấu-hình-môi-trường-env)
4. [Lấy danh sách ngân hàng](#lấy-danh-sách-ngân-hàng)
5. [Tạo mã QR Code](#tạo-mã-qr-code)
6. [Ví dụ code Python](#ví-dụ-code-python)
7. [Ví dụ code JavaScript/Node.js](#ví-dụ-code-javascriptnodejs)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

**VietQR** là dịch vụ tạo mã QR thanh toán theo chuẩn **VietQR (Napas)** của Việt Nam. Khi khách hàng quét mã QR bằng ứng dụng ngân hàng, thông tin thanh toán sẽ được tự động điền sẵn:
- Ngân hàng thụ hưởng
- Số tài khoản
- Tên người nhận
- Số tiền (nếu là QR động)
- Nội dung chuyển khoản

### Có 2 cách sử dụng:

1. **Image Service (Miễn phí, không cần API key)** - Tạo QR trực tiếp qua URL
2. **REST API v2 (Cần đăng ký, có API key)** - Tạo QR qua API với nhiều tùy chọn hơn

---

## 🔑 Đăng ký và Lấy thông tin xác thực

### 1. Đăng ký tài khoản VietQR.io

1. Truy cập: https://www.vietqr.io/
2. Đăng ký tài khoản mới
3. Vào mục **API** hoặc **My Account** để lấy:
   - `CLIENT_ID`
   - `API_KEY`

> 💡 **Lưu ý**: Nếu chỉ dùng Image Service (URL trực tiếp), bạn **KHÔNG CẦN** đăng ký tài khoản.

---

## ⚙️ Cấu hình môi trường (.env)

### 1. Tạo file `.env` trong thư mục dự án

```env
# ============================================
# VietQR API Configuration
# ============================================

# Thông tin xác thực API (Bắt buộc nếu dùng REST API v2)
VIETQR_CLIENT_ID=your_client_id_here
VIETQR_API_KEY=your_api_key_here
VIETQR_BASE_URL=https://api.vietqr.io/v2

# Thông tin tài khoản ngân hàng (Dùng cho cả Image Service và REST API)
VIETQR_BANK_CODE=VCB
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=NGUYEN VAN A

# Template QR (Chỉ dùng cho Image Service)
VIETQR_TEMPLATE_ID=compact
```

### 2. Giải thích các biến môi trường

| Biến | Mô tả | Bắt buộc | Ví dụ |
|------|-------|----------|-------|
| `VIETQR_CLIENT_ID` | Client ID từ tài khoản VietQR | Chỉ khi dùng REST API v2 | `abc123xyz` |
| `VIETQR_API_KEY` | API Key từ tài khoản VietQR | Chỉ khi dùng REST API v2 | `secret_key_here` |
| `VIETQR_BASE_URL` | Base URL của API | Chỉ khi dùng REST API v2 | `https://api.vietqr.io/v2` |
| `VIETQR_BANK_CODE` | Mã ngân hàng (3 ký tự) | ✅ Bắt buộc | `VCB`, `BIDV`, `ACB` |
| `VIETQR_ACCOUNT_NO` | Số tài khoản nhận tiền | ✅ Bắt buộc | `0123456789` |
| `VIETQR_ACCOUNT_NAME` | Tên chủ tài khoản (IN HOA, không dấu) | ✅ Bắt buộc | `NGUYEN VAN A` |
| `VIETQR_TEMPLATE_ID` | Template QR (chỉ Image Service) | ❌ Tùy chọn | `compact`, `print`, `full` |

### 3. Danh sách mã ngân hàng phổ biến

```
VCB  - Vietcombank
BIDV - BIDV
ACB  - ACB
TCB  - Techcombank
TPB  - TPBank
MB   - MB Bank
VIB  - VIB
VPB  - VPBank
MSB  - MSB
HDB  - HDBank
```

> 💡 **Lưu ý**: Để biết mã ngân hàng chính xác, hãy sử dụng API lấy danh sách ngân hàng (xem phần dưới).

---

## 🏦 Lấy danh sách ngân hàng

### API Endpoint

```
GET https://api.vietqr.io/v2/banks
```

### Không cần xác thực

API này **KHÔNG CẦN** API key, bạn có thể gọi trực tiếp.

### Response mẫu

```json
{
  "code": "00",
  "desc": "Get Bank list successful! Total 55 banks",
  "data": [
    {
      "id": 1,
      "name": "Ngân hàng TMCP An Bình",
      "code": "ABB",
      "bin": "970425",
      "shortName": "ABBANK",
      "logo": "https://api.vietqr.io/img/ABB.png",
      "transferSupported": 1,
      "lookupSupported": 1
    },
    {
      "id": 2,
      "name": "Ngân hàng TMCP Á Châu",
      "code": "ACB",
      "bin": "970416",
      "shortName": "ACB",
      "logo": "https://api.vietqr.io/img/ACB.png",
      "transferSupported": 1,
      "lookupSupported": 1
    }
    // ... các ngân hàng khác
  ]
}
```

### Các trường quan trọng

| Trường | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| `code` | Mã ngân hàng (3 ký tự) - Dùng cho Image Service | `VCB`, `ACB` |
| `bin` | Mã BIN ngân hàng (6 số) - Dùng cho REST API v2 | `970415`, `970416` |
| `name` | Tên đầy đủ ngân hàng | `Ngân hàng TMCP Á Châu` |
| `shortName` | Tên ngắn | `ACB` |
| `logo` | URL logo ngân hàng | `https://api.vietqr.io/img/ACB.png` |
| `transferSupported` | Có hỗ trợ chuyển tiền qua QR không (1 = có, 0 = không) | `1` |
| `lookupSupported` | Có hỗ trợ tra cứu STK không (1 = có, 0 = không) | `1` |

### Ví dụ: Lấy danh sách ngân hàng bằng Python

```python
import requests

def get_bank_list():
    """Lấy danh sách ngân hàng từ VietQR API"""
    url = "https://api.vietqr.io/v2/banks"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == "00":
            return data.get("data", [])
    
    return []

# Sử dụng
banks = get_bank_list()
for bank in banks:
    print(f"{bank['code']} - {bank['name']} (BIN: {bank['bin']})")
```

### Ví dụ: Lấy danh sách ngân hàng bằng JavaScript

```javascript
async function getBankList() {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const data = await response.json();
    
    if (data.code === '00') {
        return data.data;
    }
    
    return [];
}

// Sử dụng
getBankList().then(banks => {
    banks.forEach(bank => {
        console.log(`${bank.code} - ${bank.name} (BIN: ${bank.bin})`);
    });
});
```

---

## 📱 Tạo mã QR Code

Có 2 cách tạo mã QR:

### Cách 1: Image Service (Miễn phí, không cần API key)

Tạo QR trực tiếp qua URL, không cần gọi API.

#### Công thức URL

```
https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={CONTENT}&accountName={ACCOUNT_NAME}
```

#### Tham số

| Tham số | Mô tả | Bắt buộc | Ví dụ |
|---------|-------|----------|-------|
| `BANK_CODE` | Mã ngân hàng (3 ký tự) | ✅ | `VCB`, `ACB` |
| `ACCOUNT_NO` | Số tài khoản | ✅ | `0123456789` |
| `TEMPLATE` | Template QR | ❌ | `compact`, `print`, `full` |
| `amount` | Số tiền (query param) | ❌ | `100000` |
| `addInfo` | Nội dung chuyển khoản (query param) | ❌ | `THANH TOAN HD001` |
| `accountName` | Tên chủ TK (query param) | ❌ | `NGUYEN VAN A` |

#### Ví dụ URL

```python
import urllib.parse

bank_code = "VCB"
account_no = "0123456789"
template = "compact"
amount = 100000
add_info = "THANH TOAN HD001"
account_name = "NGUYEN VAN A"

# Tạo URL
params = {
    "amount": amount,
    "addInfo": add_info,
    "accountName": account_name
}
encoded_params = urllib.parse.urlencode(params)

qr_url = f"https://img.vietqr.io/image/{bank_code}-{account_no}-{template}.png?{encoded_params}"

print(qr_url)
# https://img.vietqr.io/image/VCB-0123456789-compact.png?amount=100000&addInfo=THANH+TOAN+HD001&accountName=NGUYEN+VAN+A
```

#### Sử dụng trong HTML

```html
<img src="https://img.vietqr.io/image/VCB-0123456789-compact.png?amount=100000&addInfo=THANH+TOAN+HD001&accountName=NGUYEN+VAN+A" alt="VietQR Code" />
```

---

### Cách 2: REST API v2 (Cần API key)

Tạo QR qua API, có nhiều tùy chọn và nhận được dữ liệu QR dạng base64.

#### API Endpoint

```
POST https://api.vietqr.io/v2/generate
```

#### Headers

```
x-client-id: {CLIENT_ID}
x-api-key: {API_KEY}
Content-Type: application/json
```

#### Request Body

```json
{
  "accountNo": "0123456789",
  "accountName": "NGUYEN VAN A",
  "acqId": "970415",
  "amount": "100000",
  "addInfo": "THANH TOAN HD001",
  "template": "compact",
  "format": "text"
}
```

#### Tham số Request

| Tham số | Mô tả | Bắt buộc | Ví dụ |
|---------|-------|----------|-------|
| `accountNo` | Số tài khoản | ✅ | `0123456789` |
| `accountName` | Tên chủ TK (IN HOA, không dấu) | ✅ | `NGUYEN VAN A` |
| `acqId` | Mã BIN ngân hàng (6 số) | ✅ | `970415` (VCB), `970416` (ACB) |
| `amount` | Số tiền (string) | ❌ | `"100000"` |
| `addInfo` | Nội dung chuyển khoản | ❌ | `THANH TOAN HD001` |
| `template` | Template QR | ❌ | `compact`, `qr_only`, `print` |
| `format` | Định dạng response | ❌ | `text`, `base64` |

#### Response mẫu

```json
{
  "code": "00",
  "desc": "Success",
  "data": {
    "qrCode": "00020101021238570010A00000072701270006...",
    "qrDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

#### Ví dụ: Tạo QR bằng Python

```python
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def generate_vietqr_v2(account_no: str, account_name: str, bank_bin: str, 
                       amount: int = None, add_info: str = None):
    """Tạo mã QR qua REST API v2"""
    
    client_id = os.getenv("VIETQR_CLIENT_ID")
    api_key = os.getenv("VIETQR_API_KEY")
    
    if not all([client_id, api_key]):
        raise ValueError("Cần cấu hình VIETQR_CLIENT_ID và VIETQR_API_KEY trong .env")
    
    url = "https://api.vietqr.io/v2/generate"
    
    headers = {
        "x-client-id": client_id,
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "accountNo": account_no,
        "accountName": account_name,
        "acqId": bank_bin,
        "template": "compact",
        "format": "text"
    }
    
    if amount:
        payload["amount"] = str(amount)
    
    if add_info:
        payload["addInfo"] = add_info
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == "00":
            return data.get("data")
    
    return None

# Sử dụng
result = generate_vietqr_v2(
    account_no="0123456789",
    account_name="NGUYEN VAN A",
    bank_bin="970415",  # VCB
    amount=100000,
    add_info="THANH TOAN HD001"
)

if result:
    print(f"QR Code: {result['qrCode']}")
    print(f"QR Image (Base64): {result['qrDataURL'][:50]}...")
```

#### Ví dụ: Tạo QR bằng JavaScript

```javascript
async function generateVietQR(accountNo, accountName, bankBin, amount = null, addInfo = null) {
    const clientId = process.env.VIETQR_CLIENT_ID;
    const apiKey = process.env.VIETQR_API_KEY;
    
    if (!clientId || !apiKey) {
        throw new Error('Cần cấu hình VIETQR_CLIENT_ID và VIETQR_API_KEY trong .env');
    }
    
    const url = 'https://api.vietqr.io/v2/generate';
    
    const headers = {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        accountNo: accountNo,
        accountName: accountName,
        acqId: bankBin,
        template: 'compact',
        format: 'text'
    };
    
    if (amount) {
        payload.amount = String(amount);
    }
    
    if (addInfo) {
        payload.addInfo = addInfo;
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.code === '00') {
        return data.data;
    }
    
    return null;
}

// Sử dụng
generateVietQR('0123456789', 'NGUYEN VAN A', '970415', 100000, 'THANH TOAN HD001')
    .then(result => {
        if (result) {
            console.log('QR Code:', result.qrCode);
            console.log('QR Image:', result.qrDataURL.substring(0, 50) + '...');
        }
    });
```

---

## 💻 Ví dụ code Python hoàn chỉnh

### File: `vietqr_helper.py`

```python
import os
import requests
import urllib.parse
from dotenv import load_dotenv
from typing import Optional, Dict, List

load_dotenv()

class VietQRHelper:
    """Helper class để làm việc với VietQR API"""
    
    def __init__(self):
        self.base_url = os.getenv("VIETQR_BASE_URL", "https://api.vietqr.io/v2")
        self.client_id = os.getenv("VIETQR_CLIENT_ID")
        self.api_key = os.getenv("VIETQR_API_KEY")
    
    def get_bank_list(self) -> List[Dict]:
        """Lấy danh sách ngân hàng"""
        url = f"{self.base_url}/banks"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "00":
                return data.get("data", [])
        
        return []
    
    def find_bank_by_code(self, bank_code: str) -> Optional[Dict]:
        """Tìm ngân hàng theo mã (VCB, ACB, ...)"""
        banks = self.get_bank_list()
        for bank in banks:
            if bank.get("code") == bank_code.upper():
                return bank
        return None
    
    def generate_qr_url(self, bank_code: str, account_no: str, 
                       amount: int = None, add_info: str = None,
                       account_name: str = None, template: str = "compact") -> str:
        """Tạo URL QR code (Image Service - không cần API key)"""
        params = {}
        
        if amount:
            params["amount"] = amount
        if add_info:
            params["addInfo"] = add_info
        if account_name:
            params["accountName"] = account_name
        
        encoded_params = urllib.parse.urlencode(params)
        query_string = f"?{encoded_params}" if encoded_params else ""
        
        return f"https://img.vietqr.io/image/{bank_code}-{account_no}-{template}.png{query_string}"
    
    def generate_qr_api(self, account_no: str, account_name: str, bank_bin: str,
                       amount: int = None, add_info: str = None,
                       template: str = "compact") -> Optional[Dict]:
        """Tạo QR code qua REST API v2 (cần API key)"""
        if not self.client_id or not self.api_key:
            raise ValueError("Cần cấu hình VIETQR_CLIENT_ID và VIETQR_API_KEY")
        
        url = f"{self.base_url}/generate"
        headers = {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "accountNo": account_no,
            "accountName": account_name,
            "acqId": bank_bin,
            "template": template,
            "format": "text"
        }
        
        if amount:
            payload["amount"] = str(amount)
        if add_info:
            payload["addInfo"] = add_info
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "00":
                return data.get("data")
        
        return None

# Ví dụ sử dụng
if __name__ == "__main__":
    helper = VietQRHelper()
    
    # 1. Lấy danh sách ngân hàng
    print("=== Danh sách ngân hàng ===")
    banks = helper.get_bank_list()
    for bank in banks[:5]:  # Hiển thị 5 ngân hàng đầu
        print(f"{bank['code']} - {bank['name']} (BIN: {bank['bin']})")
    
    # 2. Tìm ngân hàng VCB
    print("\n=== Tìm ngân hàng VCB ===")
    vcb = helper.find_bank_by_code("VCB")
    if vcb:
        print(f"Mã: {vcb['code']}, BIN: {vcb['bin']}, Tên: {vcb['name']}")
    
    # 3. Tạo QR URL (Image Service)
    print("\n=== Tạo QR URL ===")
    qr_url = helper.generate_qr_url(
        bank_code="VCB",
        account_no="0123456789",
        amount=100000,
        add_info="THANH TOAN HD001",
        account_name="NGUYEN VAN A"
    )
    print(f"QR URL: {qr_url}")
    
    # 4. Tạo QR qua API (nếu có API key)
    if helper.client_id and helper.api_key:
        print("\n=== Tạo QR qua API ===")
        result = helper.generate_qr_api(
            account_no="0123456789",
            account_name="NGUYEN VAN A",
            bank_bin="970415",  # VCB
            amount=100000,
            add_info="THANH TOAN HD001"
        )
        if result:
            print(f"QR Code: {result['qrCode'][:50]}...")
```

---

## 📝 Ví dụ code JavaScript/Node.js

### File: `vietqr-helper.js`

```javascript
const axios = require('axios');
require('dotenv').config();

class VietQRHelper {
    constructor() {
        this.baseUrl = process.env.VIETQR_BASE_URL || 'https://api.vietqr.io/v2';
        this.clientId = process.env.VIETQR_CLIENT_ID;
        this.apiKey = process.env.VIETQR_API_KEY;
    }
    
    async getBankList() {
        try {
            const response = await axios.get(`${this.baseUrl}/banks`);
            if (response.data.code === '00') {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách ngân hàng:', error);
            return [];
        }
    }
    
    async findBankByCode(bankCode) {
        const banks = await this.getBankList();
        return banks.find(bank => bank.code === bankCode.toUpperCase());
    }
    
    generateQRUrl(bankCode, accountNo, options = {}) {
        const {
            amount = null,
            addInfo = null,
            accountName = null,
            template = 'compact'
        } = options;
        
        const params = new URLSearchParams();
        if (amount) params.append('amount', amount);
        if (addInfo) params.append('addInfo', addInfo);
        if (accountName) params.append('accountName', accountName);
        
        const queryString = params.toString();
        const url = `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png`;
        
        return queryString ? `${url}?${queryString}` : url;
    }
    
    async generateQRApi(accountNo, accountName, bankBin, options = {}) {
        if (!this.clientId || !this.apiKey) {
            throw new Error('Cần cấu hình VIETQR_CLIENT_ID và VIETQR_API_KEY');
        }
        
        const {
            amount = null,
            addInfo = null,
            template = 'compact'
        } = options;
        
        const url = `${this.baseUrl}/generate`;
        const headers = {
            'x-client-id': this.clientId,
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        };
        
        const payload = {
            accountNo: accountNo,
            accountName: accountName,
            acqId: bankBin,
            template: template,
            format: 'text'
        };
        
        if (amount) payload.amount = String(amount);
        if (addInfo) payload.addInfo = addInfo;
        
        try {
            const response = await axios.post(url, payload, { headers });
            if (response.data.code === '00') {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Lỗi khi tạo QR:', error);
            return null;
        }
    }
}

// Ví dụ sử dụng
async function main() {
    const helper = new VietQRHelper();
    
    // 1. Lấy danh sách ngân hàng
    console.log('=== Danh sách ngân hàng ===');
    const banks = await helper.getBankList();
    banks.slice(0, 5).forEach(bank => {
        console.log(`${bank.code} - ${bank.name} (BIN: ${bank.bin})`);
    });
    
    // 2. Tìm ngân hàng VCB
    console.log('\n=== Tìm ngân hàng VCB ===');
    const vcb = await helper.findBankByCode('VCB');
    if (vcb) {
        console.log(`Mã: ${vcb.code}, BIN: ${vcb.bin}, Tên: ${vcb.name}`);
    }
    
    // 3. Tạo QR URL (Image Service)
    console.log('\n=== Tạo QR URL ===');
    const qrUrl = helper.generateQRUrl('VCB', '0123456789', {
        amount: 100000,
        addInfo: 'THANH TOAN HD001',
        accountName: 'NGUYEN VAN A'
    });
    console.log(`QR URL: ${qrUrl}`);
    
    // 4. Tạo QR qua API (nếu có API key)
    if (helper.clientId && helper.apiKey) {
        console.log('\n=== Tạo QR qua API ===');
        const result = await helper.generateQRApi(
            '0123456789',
            'NGUYEN VAN A',
            '970415', // VCB
            {
                amount: 100000,
                addInfo: 'THANH TOAN HD001'
            }
        );
        if (result) {
            console.log(`QR Code: ${result.qrCode.substring(0, 50)}...`);
        }
    }
}

// Chạy ví dụ
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VietQRHelper;
```

---

## 🐛 Troubleshooting

### 1. Lỗi "Cần cấu hình VIETQR_CLIENT_ID và VIETQR_API_KEY"

**Nguyên nhân**: Bạn đang dùng REST API v2 nhưng chưa cấu hình API key.

**Giải pháp**:
- Nếu chỉ cần tạo QR đơn giản → Dùng **Image Service** (không cần API key)
- Nếu cần dùng REST API v2 → Đăng ký tài khoản tại https://www.vietqr.io/ và lấy API key

### 2. QR không hiển thị hoặc lỗi 404

**Nguyên nhân**:
- Mã ngân hàng sai
- Số tài khoản sai format
- Template không tồn tại

**Giải pháp**:
1. Kiểm tra mã ngân hàng bằng API `/v2/banks`
2. Đảm bảo số tài khoản đúng (không có dấu cách, ký tự đặc biệt)
3. Thử template khác: `compact`, `print`, `full`

### 3. QR quét không được

**Nguyên nhân**:
- Mã BIN sai (khi dùng REST API v2)
- Tên tài khoản có dấu hoặc chữ thường
- Nội dung chuyển khoản quá dài

**Giải pháp**:
1. Lấy mã BIN chính xác từ API `/v2/banks`
2. Đảm bảo tên tài khoản: **IN HOA, KHÔNG DẤU**
3. Nội dung chuyển khoản tối đa ~23 ký tự

### 4. Lỗi CORS khi load QR image

**Nguyên nhân**: Trình duyệt block request từ domain khác.

**Giải pháp**:
- QR image được load trực tiếp từ `img.vietqr.io`, không qua backend
- Nếu vẫn lỗi, kiểm tra CORS policy của trình duyệt hoặc dùng proxy

### 5. API trả về code khác "00"

**Các mã lỗi thường gặp**:

| Code | Mô tả | Giải pháp |
|------|-------|-----------|
| `01` | Invalid request | Kiểm tra lại tham số request |
| `02` | Invalid account | Kiểm tra số tài khoản |
| `03` | Invalid bank code | Kiểm tra mã ngân hàng/BIN |
| `04` | API key invalid | Kiểm tra lại API key |

---

## 📚 Tài liệu tham khảo

- [VietQR.io Documentation](https://www.vietqr.io/)
- [VietQR API v2 - Danh sách ngân hàng](https://vietqr.io/en/danh-sach-api/api-danh-sach-ma-ngan-hang/)
- [VietQR API v2 - Generate QR](https://vietqr.io/en/generate/)
- [Napas QR Code Standard](https://www.napas.com.vn/)

---

## ✅ Checklist sử dụng

- [ ] Đăng ký tài khoản VietQR.io (nếu dùng REST API v2)
- [ ] Tạo file `.env` và cấu hình các biến môi trường
- [ ] Test API lấy danh sách ngân hàng
- [ ] Chọn ngân hàng và lấy mã BIN/code
- [ ] Test tạo QR bằng Image Service (URL)
- [ ] Test tạo QR bằng REST API v2 (nếu có API key)
- [ ] Test quét QR bằng app ngân hàng thực tế
- [ ] Kiểm tra thông tin tự động điền có đúng không

---

## 🎉 Kết luận

Với hướng dẫn này, bạn có thể:

1. ✅ **Cấu hình .env** với thông tin tài khoản ngân hàng
2. ✅ **Lấy danh sách ngân hàng** qua API `/v2/banks`
3. ✅ **Tạo mã QR** bằng 2 cách:
   - Image Service (URL trực tiếp - miễn phí)
   - REST API v2 (có API key - nhiều tùy chọn hơn)
4. ✅ **Tự động sinh QR** khi nhập STK, tên và số tiền

Chúc bạn thành công! 🚀

---

**Tác giả**: Auto-generated  
**Ngày cập nhật**: 2025-01-17  
**Phiên bản**: 2.0 (Hướng dẫn chung)
