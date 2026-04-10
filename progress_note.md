# 📖 รายงานสรุปความคืบหน้าและโครงสร้างระบบขั้นละเอียด (Deep-Dive Project Documentation) 
## date 30/3/2026
**โปรเจกต์:** Camera Rental System
**สถาปัตยกรรม:** MVC (Model-View-Controller)
**Tech Stack:** Node.js, Express.js, EJS, TailwindCSS, Vanilla JavaScript (Frontend)

---

## 🏗️ 1. สถาปัตยกรรมและโครงสร้างหลักของระบบ (Architecture)
ระบบนี้ถูกออกแบบโดยยึดหลัก **MVC (Model-View-Controller)** แบบเป๊ะๆ ซึ่งแยกการทำงาน 3 ส่วนออกจากกันอย่างชัดเจน เพื่อไม่ให้โค้ดปะปนกันมั่วซั่ว:
- **Model (แหล่งเก็บข้อมูล):** โฟลเดอร์ `model/` ทำหน้าที่เสมือนโกดังข้อมูล
- **View (หน้าตาผู้ใช้งาน):** โฟลเดอร์ `view/` ทำหน้าที่เสมือนหน้าจอแสดงผลให้ผู้ใช้เห็น (Frontend)
- **Controller (ผู้จัดการตรรกะ):** โฟลเดอร์ `controller/` ทำหน้าที่เสมือนสมองกลที่รับคำสั่งจากผู้ใช้ (ผ่าน Route) ไปคำนวณหรือดึงข้อมูลจาก Model แล้วพ่นกลับไปให้ View แสดงผล
- **Router (พนักงานรับแขก):** ไฟล์ `app.js` เป็นตัวรับ URL จากเบราว์เซอร์ แล้วชี้เป้าว่าต้องเรียก Controller ตัวไหนมาทำงาน

---

## ⚙️ 2. เจาะลึกไฟล์แกนกลาง (Core Backend Engine)

### 📄 `app.js` (ไฟล์หัวใจหลักของเซิร์ฟเวอร์)
เซิร์ฟเวอร์ทุกอย่างเริ่มต้นที่นี่ ไฟล์นี้ทำหน้าที่ตั้งค่าสภาพแวดล้อม (Environment) ทั้งหมด:
1. **การตั้งค่าเครื่องยนต์ (View Engine):** เรากำหนด `app.set('view engine', 'ejs');` เพื่อบอก Express ว่าเราจะใช้ EJS (Embedded JavaScript) ในการเรนเดอร์หน้าเว็บ HTML ที่สามารถแทรกตัวแปรได้
2. **ตัวรับข้อมูล (Body Parsers):** 
   - `app.use(express.urlencoded({ extended: true }))` ทำหน้าที่แกะกล่องข้อมูลจากหน้าเว็บเวลาผู้ใช้กด Submit Form (เช่น กรอกรหัสผ่าน, วันที่จอง) เพื่อให้เราอ่านออกในรูปแบบ `req.body`
3. **ระบบความจำ (Session Management):** 
   - `app.use(session({...}))` คือระบบจำสถานะผู้ใช้ (Stateful) ทันทีที่ผู้ใช้ล็อกอิน มันจะจำว่า "หน้าต่างเบราว์เซอร์นี้คือใคร" (จำผ่าน Cookie) ช่วยให้ระบบรู้ตัวตลอดเวลาว่านี่คือ User หรือ Admin
4. **พนักงานต้อนรับ (Route Definitions):**
   - เช่น `app.get('/browse', cameraController.browseCameras)`: เมื่อรับคำสั่งขอเข้าหน้า `/browse` (แบบ GET) ส่งงานต่อไปให้กระบวนการ `browseCameras` ในโฟลเดอร์ controller คิดต่อทันที

---

## 💾 3. เจาะลึกระบบข้อมูล (Model Layer)

### 📄 PostgreSQL (Production-style Database)
ระบบใช้ PostgreSQL เป็นแหล่งข้อมูลหลักผ่าน Sequelize ORM โดยตารางสำคัญอยู่ใน `models/` (เช่น `Equipment`, `Customer`, `Rental`, `RentalDetail`, `Payment`)

---

## 🧠 4. เจาะลึกระบบสมองกล (Controller Layer)

### 📄 `controller/authController.js` (ผู้คุมกฎและระบบสมาชิก)
รับหน้าที่จัดการ User Authentication ทั้งหมด:
1. **ระบบ Login สำหรับ Admin (`loginAdmin`):**
   รับค่า `username` และ `password` จากหน้าเว็บมาตรวจแบบตรงไปตรงมา (Hardcode) ถ้าคือ `admin` และ `password123` จะทำการตีตราบัตรผ่าน: `req.session.user = { username: 'admin', role: 'admin' }` แล้วสะบัดไปหน้า Dashboard
2. **ระบบ Login เลียนแบบ Gmail (`loginGoogle`):**
   เพื่อตอบสนอง Requirement ที่อยากได้ Google Login แบบจำลอง เราแค่รับอีเมลเข้ามา แล้วสร้าง Session ให้ในฐานะ `role: 'user'` ทันที
3. **องครักษ์พิทักษ์ Route (Middleware: `requireAuth`, `requireAdmin`):**
   - 2 ฟังก์ชันนี้เป็น **ตรรกะดักหน้าประตูก่อนเข้าถึงข้อมูล** ทุกครั้งที่จะกด "จอง (Book)" มันจะรัน `requireAuth` ก่อน
   - หลักการทำงาน: ตรวจสอบว่าใน Session มี `req.session.user` หรือไม่?
   - **ถ้ามี:** โยนคำสั่ง `next()` เพื่อปล่อยให้ตัว Controller ถัดไปรันตามปกติ (ทำงานผ่าน)
   - **ถ้าไม่มี:** โยนคำสั่ง `res.redirect('/signin')` เตะผู้เข้าชมคนนั้นกลับไปหน้าเข้าสู่ระบบทันที (บล็อกการเข้าถึง)

### 📄 `controller/cameraController.js` (หัวหน้าฝ่ายขายจัดการหน้าร้าน)
1. **ระบบแสดงสินค้าและการค้นหา (`browseCameras`):**
   - อันดับแรก รับค่า `req.query.search` (ถ้ายูสเซอร์พิมพ์ค้นหาอะไรมา)
   - นำค่าคำค้นหาไปใช้คำสั่ง `cameras.filter(...)` สแกนหาคำที่ "มีส่วนประกอบของคำนั้น" (`includes()`) ทั้งในชื่อ Brand และ Model โดยทำการ `.toLowerCase()` ลดรูปเป็นตัวพิมพ์เล็กทั้งหมดก่อน เพื่อให้ผู้ใช้พิมพ์พิมพ์ใหญ่หรือเล็กก็ค้นหาเจอ!
   - โยนข้อมูลกล้องที่กรองแล้ว (หรือทั้งหมดหากไม่ได้ค้นหา) ไปใส่ในแง่ง EJS ให้หน้าเว็บตีพิมพ์
2. **ระบบทำคำสั่งซื้อ (`bookCamera`):**
   - รับค่ารหัสกล้อง (`cameraId`), วันที่ (`startDate`, `endDate`), และราคาสุทธิ (`totalPrice`) มาจากหน้าเว็บ
   - **การเกิด Overbooking (เงื่อนไข Requirement):** โค้ดของเรามีกฎว่า "ต่อให้ `camera.stock` จะเท่ากับ 0 ไปแล้ว ระบบจองก็จะไม่ห้ามและไม่เตะออกแต่อย่างใด ยอมให้จองซ้อนต่อไป แต่อาจจะแค่จำลองการหักลบเลขสต็อกโชว์ไว้ถ้ามัน > 0"
   - สร้างตั๋วหลักฐานการจองขึ้นมา (จดบันทึกอีเมลคนจองผ่าน `req.session.user.username`) ลงในโกดัง `bookings`
3. **เรียกดูคลังตั๋วของแอดมิน (`showAdminDashboard`):**
   - ง่ายๆ ตรงไปตรงมา โกยข้อมูล `bookings` ทั้งหมด สาดส่งไปให้ `admin.ejs` ช่วยวาดให้

---

## 🎨 5. เจาะลึกระบบวาดหน้าจอ (View Layer & Frontend Logic)

ในโลกของโปรเจกต์นี้ เรามี 2 สภาพแวดล้อม:
1. โค้ดฝั่งเซิร์ฟเวอร์ EJS (`<% ... %>`): วาดรูปและลูบข้อมูล *ก่อน* ส่งให้ผู้ใช้
2. โค้ดฝั่งผู้ใช้ลูกข่าย JS (`<script>`): ทำงาน *หลัง* ผู้ใช้โหลดหน้าเว็บเสร็จ (บนเบราว์เซอร์ของเขา)

### 📄 `view/browse_camera.ejs` (หน้าซับซ้อนระดับ High)
- **การพิมพ์หน้าไพ่ (EJS Loop):** 
  เราใช้ `<% cameras.forEach(camera => { %>` เพื่อสั่งให้เซิร์ฟเวอร์ "พิมพ์การ์ดกล้องออกมาซ้ำๆ ตามจำนวนตัวแปรกล้องที่รับมา" ทุกการ์ดจะถูกใส่เครื่องหมายกำกับเฉพาะจุด เช่น `id="start-<%= camera.id %>"` (ถ้าเป็นกล้องไอดี 2 ID ของช่องกรอกคือ `start-2`) เพื่อไม่ให้ช่องกรอกข้อมูลตีกัน!
- **ซ่อน/แสดง ฟอร์มมืดแบบเนียนๆ:**
  เวลากดปุ่ม Submit ข้อมูลจะไม่ส่งไปแค่ชื่อ แต่จะซ่อนรหัสกล้องและราคาแท้จริง (`<input type="hidden">`) แบบมัดรวมส่งไปด้วยเพื่อให้ Controller หลังบ้านดึงไปใช้ง่ายๆ
- **⚙️ เอนจินคำนวณราคาฝั่งหน้าบ้าน (Client-side JS):**
  ในหน้านี้มีฟังก์ชัน JavaScript ตัวเอกคือ `calculatePrice(cameraId, pricePerDay)` ฝังตัวอยู่
  - **การดักจับ (Event Listener):** ช่องกรอกวันที่ (Date Input) ถูกตั้งค่าผ่านแอตทริบิวต์ `onchange` ทันทีที่ผู้ใช้จิ้มเลือกปฏิทิน มันจะยิงคำสั่งเข้าไปขัดจังหวะเพื่อคำนวณเบื้องหลัง
  - **การทำงาน:** กระชากค่า Date ของช่อง Start และ End มาแปลงเป็น Time Object (`new Date()`)
  - **คำนวณส่วนต่าง:** ใช้สูตรหาค่าสัมบูรณ์ความต่างของเวลา (มิลลิวินาที) `Math.abs(end - start)` และหารด้วยหน่วยของวัน `1000 มิลลิวินาที * 60 วิ * 60 นาที * 24 ชั่วโมง` และทดบวก 1 กลับไป
  - **ประเมินผล:** ถ้าคำนวณว่า "จำนวนวันติดลบ (วันเริ่มต้นเยอะกว่าวันจบ)" สคริปต์จะพ่นคำว่า 'Invalid Date' ขึ้นมาและทำการ **ยึดปุ่มจอง** (`disabled`) ไม่ให้ส่งฟอร์ม และทำให้ปุ่มออกสีทึบเพื่อเตือนผู้ใช้! แต่ถ้าวันถูกต้อง ปุ่มจองจะสว่างวาบพร้อมทำงานส่งตัว

### 📄 `view/main.ejs`, `signin.ejs`, `signup.ejs` (กลุ่มแต่งตัวและดึงดูด)
- **การวางโครงข่าย (Layout Grid & Flexbox):** ทั้งหมดใช้ TailwindCSS วางเลเยอร์ เราจำลองดีไซน์ของ Figma เป๊ะๆ ด้วยการใช้โครงสร้างแบบ `flex`, `hidden md:flex` (แบ่งหน้าจอ 2 ซีก และซีกซ้ายจะหายไปถ้าจอเล็ก), วางหน้าการ์ดแบบ `max-w-5xl rounded-xl shadow-2xl`
- **การใช้ URL เป็น Background:** โค้ด `bg-hero` ถูกประกาศใน CSS ล้วนๆ เพื่อฝังภาพจางดำ (linear-gradient opacity) ซ้อนทับให้ตัวอักษรสีขาวที่เขียนว่า 'CAPTURE MOMENTS THE OLD WAY' ทะลุออกมาโดดเด่น

### 📄 `view/admin.ejs` (ระบบวิเคราะห์ผู้ดูแล)
- **สร้างตารางแสดงผล Table Data:**
  ใช้ EJS loop ในการพิมพ์แถว `<tr>` สำหรับใบสั่งจองแต่ละรายการ หากตัวแปร `bookings.length === 0` (ยังไม่มีคนมาจองเลย) ก็จะรัน EJS เข้าบล็อก `if` เพื่อแสดงคำว่า 'No bookings have been made yet.' แบบสมูทๆ แทนที่จะทำตารางแหว่งๆ ให้ดูน่าเกลียด

---

## ✅ บทสรุปความเชื่อมโยง (How they interact together)
**ตัวอย่างการทำงานเต็มรูป (Full Flow):**
1. **User (ผู้ใช้งาน)** เข้ามาที่ `http://localhost:3000/` → `app.js` ชี้ไปที่ `authController.showMain` → โหลด `main.ejs` ให้นั่งดูวิว
2. กดปุ่ม `Browse` → `app.js` ชี้ไปที่ `cameraController.browseCameras` → เซิร์ฟเวอร์อ่านข้อมูลจากตาราง `Equipment` → ส่งไปเรนเดอร์ใน `browse_camera.ejs`
3. User เลือกปฏิทิน -> สคริปต์หน้าบ้าน `calculatePrice` รับสัมผัสและคำนวณราคาสรุปออกมา 1500 บาท
4. User ยังไม่ล็อกอิน กดจอง (Submit) → ส่ง POST `/book` → วิ่งชน Middleware `authController.requireAuth` → ยามจับได้ว่าไม่มี Session → ถูกกระแทกเด้ง `res.redirect('/signin')`!
5. User กรอกล็อกอินผ่าน → กลับมาหน้า `/browse` กดปุ่มจองอีกครั้ง → วิ่งชน Middleware แบบเดิมแต่คราวนี้ผ่าน → เข้าสู่กระบวนการ `bookCamera` → Controller หยิบข้อมูลยัดใส่กล่อง `bookings` ในหน่วยความจำ แล้วเตะกลับหน้า Browse พร้อมประวัติที่ถูกเก็บไว้ในเซิร์ฟเวอร์
6. ในที่สุด **Admin** เข้าสู่ระบบ → เข้าหน้า `/admin` → Controller ส่งถุงตะกร้า `bookings` ไปให้ EJS ถอดรหัสใส่ตารางให้เห็นครบถ้วนสมบูรณ์!

---

## 🆕 อัปเดตล่าสุด (09/04/2026) — ส่วนที่เพิ่งทำและยังไม่ได้บันทึก

> ส่วนนี้เป็น Delta Log แบบละเอียด เพื่อแก้ข้อมูลที่ล้าสมัยในเอกสารส่วนบน
> (ด้านบนบางข้อเป็น behavior เดิมก่อนปรับปรุง)
>
> ✅ **สถานะปัจจุบัน:** ระบบเชื่อมต่อกับ **pgAdmin4 / PostgreSQL** แล้วเรียบร้อย
> และสามารถเห็นตารางหลักใน `public schema` ได้จริง (`Category`, `Equipment`, `Customer`, `Rental`, `RentalDetail`, `Payment`, `Return`, `SyncLog`)

### 1) Security/Session/Production Hardening

1. **Password ไม่เก็บ plaintext แล้ว**
   - `authController.register` ใช้ `bcryptjs` hash ก่อนบันทึก
   - `authController.login` ใช้ `bcrypt.compare`
   - มี migration แบบ opportunistic สำหรับ user เก่าที่เป็น plaintext เมื่อ login สำเร็จ

2. **เพิ่ม CSRF protection ครบ flow**
   - ใช้ `attachCsrfToken` และ `requireCsrf` ในฟอร์มสำคัญ
   - หาก token ไม่ตรงจะตอบ `403 Invalid CSRF token`

3. **Session config ปลอดภัยขึ้น**
   - เช็ก `SESSION_SECRET` ใน production
   - เพิ่ม `maxAge` cookie
   - รองรับเปิด secure cookie ผ่าน `SESSION_COOKIE_SECURE=true`
   - ตั้ง `trust proxy` เมื่อบังคับ secure cookie

4. **Google login mock ถูกปิดเป็นค่าเริ่มต้น**
   - `loginGoogle` ใช้ได้เมื่อ `ENABLE_MOCK_GOOGLE_LOGIN=true` เท่านั้น

5. **App startup ทดสอบ/ดีพลอยง่ายขึ้น**
   - `app.listen` แยกด้วย `if (require.main === module)`
   - `module.exports = app` เพื่อรองรับ integration test

### 2) Data Layer: PostgreSQL 100%

1. **ยกเลิก JSON/SQLite fallback**
   - ระบบบังคับใช้ Postgres-only ผ่าน `config/db.js`

3. **Sync schema ตาม ERD ครบ 7 ตารางหลัก**
   - `Category`, `Equipment`, `Customer`, `Rental`, `RentalDetail`, `Payment`, `Return`
   - ทำผ่าน `CameraRentalSystem/service/schemaSync.js`

4. **เพิ่มตาราง `SyncLog` สำหรับ audit**
   - เก็บสถานะ sync (`success`/`failed`) และจำนวนรายการที่นำเข้า
   - โมเดลอยู่ที่ `models/syncLog.js`

### 3) Sync/Migration

- ระบบไม่ sync จาก JSON runtime อีกต่อไป เพื่อความปลอดภัยและความชัดเจนของแหล่งข้อมูล (Single Source of Truth = PostgreSQL)

### 4) Product/Camera Management ล่าสุด

1. **Add Product ฝั่ง Admin**
   - หน้า `/browse` มี Admin panel แบบพับ/ขยาย (hide/show)
   - เพิ่มสินค้าได้เฉพาะ role `admin`
   - route: `POST /admin/cameras`

2. **ข้อมูลสินค้าใช้ตารางเดิม `Equipment`**
   - ยกเลิกการใช้ตารางทดลอง `camera_products`
   - map ฟิลด์จาก UI -> ตารางเดิม (`ModelName`, `Brand`, `DailyRate`, `ImageURL`, `Status`, `CategoryID`)

3. **รองรับอัปโหลดไฟล์ภาพสินค้า**
   - ฟอร์มเพิ่มสินค้ามีทั้ง `imageFile` และ `imageUrl`
   - path รูปถูกเสิร์ฟผ่าน `/uploads/...`

### 5) Media/File Organization ที่เพิ่มแล้ว

1. **โครงสร้างโฟลเดอร์รูป**
   - `public/uploads/products`
   - `public/uploads/website`
   - `public/uploads/slips`
   - `public/uploads/avatars`
   - `public/uploads/others`

2. **Media Manager สำหรับแอดมิน**
   - หน้า `GET /admin/media`
   - อัปโหลดผ่าน `POST /admin/media/upload`
   - มี rename อัตโนมัติ (timestamp + random suffix)
   - ถ้าเลือกหมวด products + cameraId ระบบอัปเดตรูปสินค้าให้ได้

3. **User Avatar**
   - หน้า profile รองรับอัปโหลดรูปตัวเอง
   - route `POST /profile/avatar`
   - บันทึก path avatar ใน user data

### 6) Account/Admin Management ที่เพิ่มแล้ว

1. **Manage Accounts**
   - หน้า `GET /admin/accounts`
   - เปลี่ยน role user/admin ได้
   - สร้าง admin ใหม่ได้
   - ป้องกัน demote แอดมินคนสุดท้าย

2. **ปุ่มนำทาง**
   - เพิ่มปุ่มไป `Main`, `Browse`, `Admin` ในหลายหน้า admin

### 7) Signup/Profile Data ที่เพิ่มล่าสุด

1. **หน้า signup เก็บข้อมูล user เพิ่ม**
   - `firstName` (required)
   - `lastName` (required)
   - `phone` (required)
   - `address` (optional)
   - พร้อม `username`, `password`, `email` เดิม

2. **ข้อมูลเหล่านี้ถูกส่งต่อเข้า Customer**
   - ผ่าน direct upsert + ORM sync logic
   - ช่วยให้ข้อมูลใน pgAdmin ครบขึ้น

3. **ปรับ UI หน้า signup ไม่ล้นเฟรม**
   - เพิ่มความสูง panel และเปิด scroll ใน card ฝั่งขวา
   - ลด spacing/ความสูง input ให้พอดีกรอบ

### 8) สถานะฟังก์ชันที่ยังควรทำต่อ (ยังไม่ครบ)

1. **DB-first เต็มระบบยังไม่ 100%**
   - ยังมีหลาย flow เขียน JSON ก่อน แล้วค่อย sync
   - หากต้องการลดความซับซ้อน ควรย้ายเป็น write-through DB เป็นหลัก

2. **Booking domain ยังผูกกับข้อมูล local บางส่วน**
   - การคำนวณ overlap และ stock ในหน้า browse/book ยังมี dependency กับรูปแบบข้อมูลที่ map จากหลายแหล่ง

3. **ไม่มี transactional boundary ครบวงจร**
   - เช่น create rental + detail + payment ควรอยู่ใน transaction เดียวเมื่อเป็น production-grade

4. **ยังไม่มีหน้า monitor sync status ในเว็บ**
   - ปัจจุบันดู log ผ่าน `SyncLog` ใน pgAdmin เป็นหลัก

5. **User profile edit (ชื่อ/เบอร์/ที่อยู่) ยังไม่ครบ UX**
   - signup มีข้อมูลเพิ่มแล้ว แต่หน้า profile ยังไม่รองรับ edit all fields เต็มรูป

### 9) วิธีตรวจว่า sync เข้าจริง (Checklist สำหรับทีม)

1. สมัคร user ใหม่ในหน้า signup
2. เปิด pgAdmin และรัน:
   ```sql
   SELECT "CustomerID","FirstName","LastName","Phone","Email","Address"
   FROM "Customer"
   ORDER BY "CustomerID" DESC;
   ```
3. ถ้าไม่เจอ ให้ตรวจว่าแอปรัน process ล่าสุดและเชื่อม DB เดียวกับที่เปิดใน pgAdmin
4. ตรวจ `SyncLog` เพื่อดูว่า sync success/failed:
   ```sql
   SELECT "SyncLogID","Source","Status","ImportedCustomers","Message","SyncedAt"
   FROM "SyncLog"
   ORDER BY "SyncLogID" DESC;
   ```

---

## 🔌 คู่มือเชื่อมต่อ pgAdmin4 แบบละเอียด (สำหรับเพื่อนที่เอาโปรเจกต์ไปต่อ)

หัวข้อนี้เขียนให้คนที่เพิ่ง clone โปรเจกต์สามารถทำตามได้ทีละขั้นจนเห็นข้อมูลใน pgAdmin4 จริง

### A) สิ่งที่ต้องมีบนเครื่องก่อนเริ่ม

1. ติดตั้ง **PostgreSQL** (เช่น v15+ หรือ v18)
2. ติดตั้ง **pgAdmin4**
3. ต้องรู้ credential ของ DB:
   - Host (ส่วนใหญ่ `localhost`)
   - Port (ส่วนใหญ่ `5432`)
   - Username (เช่น `postgres`)
   - Password
   - Database name (เช่น `postgres` หรือ `camera_rental`)

### B) ต่อ Server ใน pgAdmin4

1. เปิด pgAdmin4
2. ที่แถบซ้าย คลิกขวา `Servers` -> `Register` -> `Server...`
3. แท็บ **General**
   - Name: ตั้งอะไรก็ได้ เช่น `Local PostgreSQL`
4. แท็บ **Connection**
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: (ใส่รหัสของเครื่อง)
   - ติ๊ก `Save password` (ถ้าต้องการ)
5. กด `Save`

### C) ตั้งค่าโปรเจกต์ให้ใช้ PostgreSQL

ให้รันแอปพร้อม environment variables เหล่านี้:

- `DB_DIALECT=postgres`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=postgres` (หรือ db ที่สร้างไว้)
- `DB_USER=postgres`
- `DB_PASSWORD=<your-password>`

และเพื่อรองรับ route SQL realtime (ถ้าจะใช้):

- `ENABLE_PG_REALTIME=true`
- `PGHOST=localhost`
- `PGPORT=5432`
- `PGDATABASE=postgres`
- `PGUSER=postgres`
- `PGPASSWORD=<your-password>`

> แนะนำ: ตั้งทั้งชุด `DB_*` และ `PG*` ให้ตรงกัน เพื่อลดความสับสน

### D) ลำดับการรันที่ถูกต้อง

1. เปิด terminal ที่ root โปรเจกต์
2. ติดตั้ง dependency
3. ตั้ง env ตามข้อ C
4. รันแอป
5. เข้าเว็บและทำ action เช่น:
   - สมัคร user
   - เพิ่มสินค้า
   - จอง/ยืนยัน/จ่าย
6. กลับไป pgAdmin4 แล้ว `Refresh` ตาราง

### E) ตารางที่ควรเห็นใน pgAdmin หลังเชื่อมสำเร็จ

ใน `Databases -> <db> -> Schemas -> public -> Tables` ควรเห็น:

- `Category`
- `Equipment`
- `Customer`
- `Rental`
- `RentalDetail`
- `Payment`
- `Return`
- `SyncLog`

### F) SQL เช็กเร็วว่าเชื่อมและเขียนข้อมูลได้จริง

1. ดูลูกค้าใหม่ล่าสุด:
```sql
SELECT "CustomerID","FirstName","LastName","Phone","Email","Address"
FROM "Customer"
ORDER BY "CustomerID" DESC
LIMIT 20;
```

2. ดูสินค้าล่าสุด:
```sql
SELECT "EquipmentID","Brand","ModelName","DailyRate","ImageURL","Status","CategoryID"
FROM "Equipment"
ORDER BY "EquipmentID" DESC
LIMIT 20;
```

3. ดู log sync:
```sql
SELECT "SyncLogID","Source","Status","ImportedCustomers","ImportedRentals","ImportedPayments","Message","SyncedAt"
FROM "SyncLog"
ORDER BY "SyncLogID" DESC
LIMIT 50;
```

### G) อธิบาย behavior เวลาเพื่อนไม่ได้ต่อ pgAdmin

ระบบรองรับการทำงานแบบ local JSON ได้ก่อน:
- เพื่อนที่ยังไม่ต่อ PostgreSQL ยังทดสอบ flow ได้
- เมื่ออีกคน pull โค้ดไปแล้วรันในโหมด PostgreSQL
  - ระบบมีทั้ง realtime sync และ legacy sync เพื่อดึงข้อมูลเข้า DB

### H) Troubleshooting (อาการที่เจอบ่อย)

1. **ERROR: relation does not exist**
   - ยังไม่ได้ sync schema หรือเปิดคนละ database
   - แก้: เช็ก env + restart app + refresh tables ใน pgAdmin

2. **สมัครแล้วไม่เข้า Customer**
   - process ที่รันอาจเป็นโค้ดเก่า (ยังไม่ restart)
   - หรือ query คอลัมน์ผิด (ใน DB ไม่มี `username`, map ไป `FirstName/LastName`)

3. **ต่อได้แต่ไม่เห็นข้อมูลใหม่**
   - เปิดผิด DB (เช่นแอปเขียน `postgres` แต่ pgAdmin เปิดอีก DB)
   - ลองรัน query เช็กจาก `Email` จริงที่สมัคร

4. **Login/ฟอร์ม submit แปลก ๆ**
   - ตรวจว่า CSRF token ถูกส่งใน form ครบ
   - ตรวจว่า app path/routing เป็น process ล่าสุด

### I) Best Practice สำหรับทำงานเป็นทีม

1. ก่อนเริ่มทุกวัน ให้ pull ล่าสุด + restart server
2. ใช้ env template เดียวกันทั้งทีม (`DB_*` + `PG*`)
3. ทุกครั้งที่เพิ่มฟีเจอร์ที่เขียนข้อมูล ให้เช็กด้วย SQL ใน pgAdmin
4. เวลาส่งงาน ให้แนบ query ตรวจข้อมูลจริง (Customer/Equipment/SyncLog)

---

## 🆕 อัปเดตล่าสุด (10/04/2026) — การยืนยันโครงสร้างฐานข้อมูล (ERD Alignment)

> ✅ **สถานะปัจจุบัน:** ตรวจสอบความถูกต้องของ Schema ทั้งหมดเทียบกับ ER Diagram แล้ว

### 1) การตรวจสอบความสอดคล้องกับ ER Diagram
จากการตรวจสอบไฟล์ในโฟลเดอร์ `models/` และความสัมพันธ์ใน `models/index.js` พบว่าโครงสร้างปัจจุบันตรงตาม Diagram 100%:

1.  **ครบถ้วนทุกตาราง**: มี Model สำหรับ `Category`, `Equipment`, `Customer`, `Rental`, `RentalDetail`, `Payment`, และ `Return`
2.  **ความสัมพันธ์เป๊ะ**: 
    - `Category` (1) - `Equipment` (N)
    - `Customer` (1) - `Rental` (N)
    - `Rental` (1) - `RentalDetail` (N)
    - `Equipment` (1) - `RentalDetail` (N)
    - `Rental` (1) - `Payment` (N)
    - `RentalDetail` (1) - `Return` (1) (มีการตั้งค่า `unique: true` ที่ `RentalDetailID` ในตาราง Return)
3.  **Data Types ทันสมัย**:
    - มีการใช้ `DECIMAL(10, 2)` สำหรับ `DailyRate`, `TotalAmount`, `LateFee`, และ `DamageFee` เพื่อความแม่นยำในการคำนวณเงิน
    - มีการใช้ `ENUM` สำหรับ `Status` และ `RentalStatus` เพื่อควบคุมสถานะให้เป็นระบบ
    - ฟิลด์ที่ต้องใช้ความละเอียดสูงอย่าง `Phone` และ `Email` มีการตั้งค่า `allowNull: false` และ `unique: true` ไว้อย่างเหมาะสม

### 2) การเปลี่ยนระบบฐานข้อมูล (Database Migration)
- **ระบบหลัก**: เปลี่ยนจาก SQLite (Local File) มาเป็น **PostgreSQL** เพื่อให้รองรับการทำงานระดับ Professional และเชื่อมต่อกับ pgAdmin4 ได้โดยตรง
- **การตั้งค่า**: ติดตั้งแพ็กเกจ `dotenv` และสร้างไฟล์ [**.env**](file:///d:/GitHub/cp252project/.env) เพื่อจัดการค่าคงที่ต่างๆ (Environment Variables) เช่น รหัสผ่านฐานข้อมูล และ Session Secret

### 3) การอัปเดตโครงสร้าง (Schema Enhancements)
- **Customer Table**: เพิ่มฟิลด์ `Username` เพื่อให้สอดคล้องกับระบบ Login และช่วยในการค้นหาข้อมูล (เชื่อมต่อผ่าน `authController.js` และ `directPgSync.js`)
- **Address Handling**: ปรับระดับ Model และ Controller ให้ฟิลด์ `Address` เป็น `null` ได้ (Optional) หากผู้ใช้ยังไม่กรอกตอนสมัคร
- **Automatic Sync**: เปิดใช้งาน `{ alter: true }` ใน Sequelize เพื่อให้ฐานข้อมูลใน pgAdmin4 อัปเดตโครงสร้างตามโค้ดล่าสุดโดยอัตโนมัติเมื่อ Restart แอป

### 4) ความเสถียรของระบบ (System Stability)
- **Sequential Startup**: ปรับปรุง `app.js` ให้รันการตรวจสอบ Schema ให้เสร็จสิ้นก่อนเริ่มการย้ายข้อมูล (Migration) เพื่อป้องกันปัญหา Column not found

---

## 🧾 หมายเหตุการใช้งานเอกสารฉบับนี้
- ส่วนหัวเอกสาร (ก่อนหน้านี้) เป็น baseline เดิมช่วงเริ่มทำโปรเจกต์
- ให้ใช้หัวข้อ **อัปเดตล่าสุด (10/04/2026)** เป็นหลักฐานยืนยันความถูกต้องของโครงสร้างปัจจุบัน
