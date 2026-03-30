1.System สามารถค้นหากล้องตามชื่อรุ่น/แบรนด์,
2.System allows การจองเช่า : ผู้ใช้เลือกช่วงเวลาเช่า
3.System can คำนวณราคารวมอัตโนมัติ
4.System should ตรวจสอบสต็อกสินค้า and display it,
5D.o not need to check if สินค้า is already reserved. (allow overbooked)
6.Use gmail as login for general user, hardcode username/password for admin




to do list
Camera Rental System - Task Checklist
นี่คือ To-do list ขอบเขตงานที่จะต้องพัฒนาตาม finalrequirement.md ทุกข้อ โดยใช้ Node.js + Express (EJS) และ TailwindCSS ในโฟลเดอร์ Camerarental

1: การตั้งค่าโปรเจกต์ (Project Setup)
 สร้างโฟลเดอร์ Camerarental/ ใหม่ และคัดลอกโครงสร้างจาก roombook(template) (MVC: model, view, controller)
 ติดตั้ง Dependencies (Express, EJS, Express-session)
 ตั้งค่าไฟล์ app.js สำหรับจัดการ Routing และเชื่อมโยงโฟลเดอร์
 ติดตั้งและตั้งค่า TailwindCSS สำหรับตกแต่งหน้าตาแอปพลิเคชัน (เพิ่ม Script CDN หรือเชื่อมไฟล์ผ่าน Build Process เพื่อใช้งานร่วมกับ EJS)
2: การพัฒนาหน้า Interface 2 หน้าแรกตาม Figma
หน้าหลัก (Main / Login Flow)
 ออกแบบและพัฒนา Camerarental/view/main.ejs ซึ่งทำหน้าที่เป็นหน้าแรกที่ต้อนรับผู้ใช้งานด้วยสไตล์ของ TailwindCSS
 เพิ่มปุ่ม Gmail Login (จำลอง OAuth ด้วยอีเมล) สำหรับฝั่งผู้ใช้งานทั่วไป (General User)
 เพิ่มส่วนหน้าต่าง Admin Login สำหรับรับ ID รหัสผ่านแบบ Hardcoded ทั่วไป
หน้าค้นหาสินค้า (Browse Camera)
 ออกแบบ Camerarental/view/browse_camera.ejs ตกแต่งการเรียงกล้องออกมาเป็น Card สวยงามด้วย TailwindCSS
 สร้างหน้าต่างให้ผู้ใช้ให้กดเลือกช่วงเวลาที่จะเช่า (ฟอร์ม Date Range) สำหรับการจองเช่า
  3: การตอบโจทย์ finalrequirement.md (Core System Logic)
ระบบสินค้าและการค้นหา
 เพิ่มข้อมูล Mock ของกล้องลงใน Camerarental/model/data.js (ชื่อแบรนด์, รุ่น, จำนวนในสต็อก, ราคาเช่าต่อวัน)
 [Req 1] สร้างระบบค้นหากล้อง (Search Filter): เขียนโค้ดใน Control หรือ JS ให้ผู้ใช้ค้นหาจากตัวอักษรของชื่อรุ่น/แบรนด์ผ่านหน้าจอได้
 [Req 4] สร้างระบบตรวจสอบและแสดงสต็อกสินค้า: ตรวจเช็คข้อมูลกล้องว่ามีของกี่ชิ้น และนำไปแสดงผลสถานะตรง Card กล้อง (เช่น Available: 5)
ระบบการจองและการคำนวณราคา
 [Req 2] สร้างกระบวนการจองแบบเลือกช่วงเวลา: ทำระบบรับข้อมูล Date Start และ Date End จากผู้ใช้ในหน้า browse_camera
 [Req 3] ระบบคำนวณราคารวมอัตโนมัติ: เมื่อผู้ใช้เปลี่ยนระยะเวลากี่วัน ให้ใช้ JS บนหน้าจอคำนวณ (เช่น 3 วัน × 500 บาท = 1,500 บาท) ทันที
 [Req 5] ข้ามการเช็คการจองซ้อน: เมื่อกด Booking สินค้า จะแค่หักสต็อกที่แสดงผลเฉยๆ หรือให้ยิงสำเร็จเลยโดยไม่อิงว่าของชิ้นนั้นโดนจองไว้แล้วหรือไม่ (Allow Overbooked)
4: ระบบ Authentication ชั่วคราว (Login Requirement)
 [Req 6] สร้างระบบ Login ผู้ใช้งานทั่วไป: เมื่อกด Login with Gmail หน้าบ้านจะเข้าสู่ระบบในฐานะของ "User ปกติ" (อาจเป็น Fake JS Session หรือ Express Session)
 [Req 6] สร้างระบบ Login แอดมิน: กำหนดค่า Hardcode ของแอดมิน (เช่น admin / password123) หากล็อกอินสำเร็จจะได้หน้า Dashboard ของผู้ดูแลระบบ
5: Verification & Testing
 รันเซิร์ฟเวอร์ด้วยระบบ node app.js
 ทดสอบพิมพ์ค้นหากล้อง และลองจองเพื่อดูผลรวมราคาวัน
 ตรวจสอบความสวยงาม Responsive ของโครงสร้างหน้าจอด้วย Tailwind CSS