# 🚀 PostgreSQL Database Setup Guide

## ขั้นตอนการตั้ง PostgreSQL Database ให้เป็นจริง

### 1️⃣ ติดตั้ง PostgreSQL

#### Windows:
- ดาวน์โหลด: https://www.postgresql.org/download/windows/
- ติดตั้งแบบ normal
- ตั้ง password สำหรับ user `postgres`
- ใช้ Port ตั้งต้น: **5432**

#### macOS:
```bash
brew install postgresql@15
```

#### Linux (Ubuntu):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

---

### 2️⃣ สร้าง Database

เปิด **pgAdmin** หรือ **psql** แล้วรัน:

```sql
CREATE DATABASE camera_rental;
```

หรือใช้ command line:

```bash
createdb camera_rental
```

---

### 3️⃣ ตั้งค่า Environment Variables

1. Copy `.env.example` → `.env` ในรูท
2. แก้ไขค่าตรงนี้ (ให้ตรงกับ PostgreSQL ของคุณ):

```env
DB_DIALECT=postgres
DB_HOST=localhost          # เปลี่ยนเป็น localhost หรือ IP ของ server
DB_PORT=5432               # ตัวเลขที่ตั้งไว้ตอนติดตั้ง
DB_NAME=camera_rental      # ชื่อ database ที่สร้าง
DB_USER=postgres           # username default ของ PostgreSQL
DB_PASSWORD=YOUR_PASSWORD  # ⚠️ เปลี่ยนเป็นรหัสผ่านของคุณ

SESSION_SECRET=replace-with-a-long-random-string-12345678901234567890
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@camera.com
ADMIN_PASSWORD=admin123456
```

---

### 4️⃣ ติดตั้ง Dependencies

```bash
npm install
```

---

### 5️⃣ 🌱 รัน Seed Data

หลังจากสร้าง database และตั้ง `.env` แล้ว รัน:

```bash
npm run seed
```

**ผลลัพธ์ที่คาดหวัง:**
```
🌱 Starting database seeding...
✅ Database schema synced
✅ Created 5 categories
✅ Created 20 cameras/equipment
✅ Created 8 customers (1 admin + 7 users)
✅ Created 10 rentals
✅ Created 10 rental details
✅ Created 10 payments
✅ Created 4 return records

🎉 ===== DATABASE SEEDING COMPLETED SUCCESSFULLY =====

📊 Summary:
   ✓ Categories: 5
   ✓ Equipment: 20
   ✓ Customers: 8 (1 admin + 7 users)
   ✓ Rentals: 10
   ✓ Rental Details: 10
   ✓ Payments: 10
   ✓ Returns: 4

🔐 Login Credentials:
   Admin:
      Email: admin@camera.com
      Password: admin123456

   Sample User:
      Email: somchai@example.com
      Password: password123
```

---

### 6️⃣ เริ่มแอปพลิเคชัน

```bash
npm start
```

เปิดเบราว์เซอร์ไปที่: **http://localhost:3000**

---

## 📝 ข้อมูล Seed Data ที่ได้

### 📷 Categories (5 หมวด)
1. DSLR
2. Mirrorless
3. Vintage
4. Action Camera
5. Accessories

### 📸 Equipment (20 กล้อง)
- Canon EOS 5D Mark IV (DSLR) - 2,500 บาท/วัน
- Canon EOS R5 (Mirrorless) - 3,500 บาท/วัน
- Nikon D850 (DSLR) - 2,800 บาท/วัน
- Sony A7R IV (Mirrorless) - 3,200 บาท/วัน
- Leica M3 (Vintage) - 1,800 บาท/วัน
- GoPro Hero 11 (Action) - 500 บาท/วัน
- และอีก 14 อุปกรณ์...

### 👥 Customers (8 คน)
1. **admin@camera.com** / `admin123456` (Admin)
2. **somchai@example.com** / `password123` (User)
3. **chanida@example.com** / `password123` (User)
4. **nirun@example.com** / `password123` (User)
5. **wanna@example.com** / `password123` (User)
6. **sorasak@example.com** / `password123` (User)
7. **nattapak@example.com** / `password123` (User)
8. **pichaya@example.com** / `password123` (User)

### 📊 Sample Data
- **10 Rentals** (pending, active, completed)
- **10 Payments** (pending, approved)
- **4 Returns** (completed rentals)

---

## ⚠️ Troubleshooting

### ❌ "Error: connect ECONNREFUSED 127.0.0.1:5432"
**✓ วิธีแก้:**
```bash
# ตรวจสอบว่า PostgreSQL กำลังทำงาน
# Windows: เปิด Services และ Start PostgreSQL
# macOS: brew services start postgresql@15
# Linux: sudo service postgresql start
```

### ❌ "Error: role "postgres" does not exist"
```bash
# สร้าง superuser ใหม่
createuser -s postgres
```

### ❌ "Database camera_rental already exists"
```bash
# ลบและสร้างใหม่
dropdb camera_rental
createdb camera_rental
npm run seed
```

### ❌ ข้อมูลซ้ำกันเมื่อ run seed หลายครั้ง
✓ Seed script จะตรวจสอบว่ามีข้อมูลแล้ว จึงจะข้ามไปถ้ามี

---

## 🔄 คำสั่ง Useful

```bash
# ติดตั้ง dependencies
npm install

# รัน seed data
npm run seed

# เริ่มแอปพลิเคชัน
npm start

# เช็ค database จาก psql
psql -U postgres -d camera_rental
```

---

## 📞 ถ้าต้องการรีเซต Database

```bash
# ใน psql
DROP DATABASE camera_rental;
CREATE DATABASE camera_rental;
```

แล้วรัน `npm run seed` อีกครั้ง

---

**✅ ตอนนี้พร้อมแล้ว! ลองเข้า http://localhost:3000 และทดสอบระบบ**