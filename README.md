# FastAccounting - Node.js Migration

FastAccounting is a web-based accounting application featuring a **React frontend** and **Node.js/Express backend**, designed to manage customers, loan transactions, and generate debt settlement reports.

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Atlas or local)
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **PDF Generation**: PDFKit

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **State Management**: React Query

### Deployment
- **Platform**: Vercel (Serverless Functions)
- **Database**: MongoDB Atlas (Cloud)

---

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js 18+**: [Download Node.js](https://nodejs.org/)
- **MongoDB Atlas Account**: [Sign up](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **Git**: For version control

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/realthdat/FastAccounting.git
cd FastAccounting
```

### 2. Backend Setup

```bash
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fastaccounting
# JWT_SECRET=your_secret_key_here

# Seed initial data (admin user + interest configs)
node seed.js

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 🔐 Default Credentials

After running `node seed.js`, you can login with:

- **Username**: `admin`
- **Password**: `admin123`
- **PIN**: `1234` (for secure delete operations)

---

## 📁 Project Structure

```
FastAccounting/
├── api/                    # Node.js Backend
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Transaction.js
│   │   ├── InterestConfig.js
│   │   └── Counter.js
│   ├── routes/
│   │   ├── auth.js        # Authentication (JWT)
│   │   ├── customers.js   # Customer CRUD
│   │   ├── transactions.js # Transaction CRUD + Bulk Pay
│   │   ├── interest.js    # Interest Config CRUD
│   │   └── reports.js     # PDF Generation
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   ├── utils/
│   │   ├── interest.js    # Interest calculation
│   │   ├── money.js       # Vietnamese money reader
│   │   ├── counter.js     # ID generation
│   │   ├── helpers.js     # Utility functions
│   │   └── pdf.js         # PDF generation
│   ├── fonts/             # Times New Roman fonts
│   ├── index.js           # Main Express app
│   ├── seed.js            # Database seeding script
│   └── package.json
│
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   │   └── api.js     # Axios client with JWT
│   │   └── utils/
│   ├── .env.development
│   ├── .env.production
│   └── package.json
│
├── vercel.json            # Vercel deployment config
└── README.md
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (protected)

### Customers
- `GET /api/customers` - List all customers with status
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer by ID
- `PATCH /api/customers/:id` - Update customer
- `POST /api/customers/delete-secure` - Delete with PIN verification

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `POST /api/transactions/bulk-pay` - Bulk payment with PIN
- `POST /api/transactions/delete-secure` - Delete with PIN
- `GET /api/transactions/reports/debt` - Debt report

### Interest Configurations
- `GET /api/interest-configs` - List all configs
- `POST /api/interest-configs` - Create config
- `GET /api/interest-configs/:code` - Get config by code
- `PATCH /api/interest-configs/:code` - Update config
- `POST /api/interest-configs/delete-secure` - Delete with PIN

### Reports
- `GET /api/reports/:customer_id/pdf` - Generate PDF report

---

## 💡 Features

### Interest Calculation
- **Custom time calculation**: 30 days = 1 month
- **Rounding rules**:
  - 0-10 days → 0 month
  - 11-20 days → 0.5 month
  - 21+ days → 1 month
- **Interest rounding**: Unit digit 0-7 round down, 8-9 round up

### Vietnamese Money Reader
Converts numbers to Vietnamese words:
- `1,000,000` → "Một triệu đồng"
- `2,500,000` → "Hai triệu năm trăm nghìn đồng"

### PDF Reports
- Professional debt settlement reports
- Vietnamese fonts support
- Grouped by month
- Signature area for both parties

---

## 🚀 Deployment to Vercel

### 1. Prepare MongoDB Atlas
- Create cluster
- Create database user
- Whitelist IP: `0.0.0.0/0` (allow from anywhere)
- Copy connection string

### 2. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - Framework Preset: Other
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `NODE_ENV`: `production`
5. Deploy!

---

## 🔧 Environment Variables

### Backend (`api/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fastaccounting
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env.development`)
```env
VITE_API_URL=http://localhost:3000/api
```

### Frontend (`client/.env.production`)
```env
VITE_API_URL=/api
```

---

## 📝 Migration Notes

### Breaking Changes from Python Version
1. **Authentication**: Session tokens → JWT
   - Users need to login again after deployment
   - Tokens expire after 7 days

2. **Password Hashing**: MD5 → Bcrypt
   - More secure
   - Existing users may need password reset

3. **Batch PDF Export**: Not available on Vercel
   - Serverless filesystem limitation
   - Export PDFs individually instead

### What Stayed the Same
- ✅ Database structure (MongoDB)
- ✅ Interest calculation logic
- ✅ Vietnamese money reader
- ✅ PDF report format
- ✅ All business logic

---

## 🧪 Testing

### Manual API Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create Customer (with token)
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Nguyễn Văn A","contact_info":"0123456789"}'

# Generate PDF
curl -X GET "http://localhost:3000/api/reports/KH001/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.pdf
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check `MONGODB_URI` in `.env`
- Verify MongoDB Atlas network access (whitelist IP)
- Ensure database user has correct permissions

### JWT Token Issues
- Check `JWT_SECRET` is set
- Verify token is being sent in Authorization header
- Check token expiration (default 7 days)

### PDF Generation Fails
- Verify fonts exist in `api/fonts/`
- Check file permissions
- Monitor Vercel function logs

---

## 📄 License

ISC

---

## 👥 Contributors

- Original Python version: [realthdat](https://github.com/realthdat)
- Node.js migration: Antigravity AI

---

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Include error logs and environment info

---

**Happy Accounting! 💰**
