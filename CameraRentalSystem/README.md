# Update1
# Camera Rental System

A simple web application for renting cameras built with Node.js and Express.

## How to Run

1.  **Install dependencies:**
    Open your terminal in the `CameraRentalSystem` directory and run:
    ```bash
    npm install
    ```

2.  **Start the server:**
    Run the following command:
    ```bash
    node app.js
    ```

3.  **Access the application:**
    Open your browser and go to:
    [http://localhost:3000](http://localhost:3000)

## Features
- Main page for browsing cameras
- Sign-in / Sign-up (Mock)
- Camera booking (Mock)
- Admin dashboard (Mock)

//

## PostgreSQL Realtime Mode (Optional - Disabled by default)

> โหมดนี้ไว้สำหรับเดโม่กับ pgAdmin4 และการเขียน SQL ดึงข้อมูลแบบ realtime (ฝั่ง API)
> ตอนนี้ระบบหลักยังพัฒนาแบบเดิมได้ปกติ เพราะโหมดนี้จะไม่ทำงานถ้าไม่เปิดเอง

1. ติดตั้ง dependency ในโฟลเดอร์ `CameraRentalSystem`
   ```bash
   npm install
   ```
2. ตั้งค่า environment variables ก่อนรัน
   ```bash
   set ENABLE_PG_REALTIME=true
   set PGHOST=localhost
   set PGPORT=5432
   set PGDATABASE=camera_rental
   set PGUSER=postgres
   set PGPASSWORD=your_password
   ```
3. รันแอป
   ```bash
   node app.js
   ```
4. ทดสอบ endpoint SQL
   - `GET /api/sql/health`
   - `GET /api/sql/revenue-daily`
   - `GET /api/sql/active-rentals`

> ถ้ายังไม่อยากใช้ PostgreSQL ให้ไม่ต้องตั้ง `ENABLE_PG_REALTIME` (หรือให้เป็น `false`) ระบบจะปิดโหมดนี้อัตโนมัติ
