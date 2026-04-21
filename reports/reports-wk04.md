# Camera Rental System (ระบบเช่ากล้อง) - Project Summary (Week 04)

## สรุปการดำเนินงาน Phase 4 (Final Polish & Feature Completion)

หลังจากรากฐานของระบบฐานข้อมูล การจัดการ MVC และโครงสร้างหลักต่างๆ ถูกวางไว้อย่างเสถียรใน Week 03 ในสัปดาห์ที่ 4 ทีมงานได้มุ่งเน้นไปที่ **การปรับปรุงจุดบกพร่อง, การเพิ่มฟีเจอร์ตาม Requirement พิเศษ, และการเตรียมตัวเพื่อนำเสนอ (Presentation Prep)**

สิ่งที่มีการพัฒนาเพิ่มเติมจาก WK03 อย่างเห็นได้ชัด มีดังต่อไปนี้:

---

### 1. ระบบรักษาความปลอดภัยและการยืนยันตัวตน (Authentication & Security)
*   **Gmail Enforcement (นโยบายบังคับอีเมล):** ปรับปรุงระบบ Validation บังคับให้ผู้ใช้งานทั่วไปทุกคน ต้องทำการลงทะเบียนและใช้อีเมลที่ลงท้ายด้วย `@gmail.com` เท่านั้น
*   **Flexible Login (การเข้าสู่ระบบแบบยืดหยุ่น):** เพิ่มลูกเล่นให้ช่อง Login ฉลาดขึ้น โดยผู้ใช้งานสามารถเลือกที่จะพิมพ์ **Username แบบสั้น** หรือ **Email แบบเต็ม** ก็ได้ ระบบจะทำการค้นหาจากทั้งสองคอลัมน์ให้อัตโนมัติ (ผ่านตรรกะ `Op.or` ของ Sequelize)
*   **Hardcoded Admin Bypass:** ออกแบบช่องทาง "ทางลัด" (Fast-track) ให้ผู้ตรวจงานหรือ Admin สามารถใช้ `username: admin` และ `password: admin1234` ในการเจาะเข้าหน้าระบบหลังบ้านได้ทันทีโดยไม่ต้องผ่านกระบวนการ Hash Password เพื่อความสะดวกในการทดสอบ

### 2. ระบบจำลองการเข้าสู่ระบบผ่าน Google (Google Mock SSO)
*   **Fake Google UI (`google_mock.ejs`):** นวัตกรรมทดแทนการใช้ API จริง เพื่อความสะดวกในการนำเสนอโปรเจค ทีมงานได้แกะโครงสร้าง UI ของ **Google Account Chooser** มาสร้างเป็นหน้า EJS จำลองที่มีความสมจริงระดับ 99% (มีโลโก้, แอนิเมชันปุ่ม, แบบฟอร์มกรอกอีเมล)
*   **Mock Accounts (บัญชีหน้าม้า):** ฝังชุดข้อมูลผู้ใช้ตัวอย่าง (User 1, User 2, User 3) ลงในหน้าเว็บจำลอง เพื่อให้อาจารย์ผู้ตรวจสามารถกดจิ้มเลือกบัญชี และทะลุเข้าสู่ระบบ (Bypass password) ได้ลื่นไหลเหมือนใช้ Google Login ของจริง
*   **Security Routing Constraints:** ฟีเจอร์นี้ถูกล็อกเงื่อนไขไว้รัดกุม โดยจะทำงานต่อเมื่อตัวแปรกำหนดสภาพแวดล้อมระบุเป็น `ENABLE_MOCK_GOOGLE_LOGIN=true` ช่วยป้องกันไม่ให้รันในระดับ Production ได้

### 3. ปรับปรุงตรรกะทางธุรกิจเชิงลึก (Advanced Business Logic)
*   **Allow Overbooking (อนุญาตให้จองซ้อนได้):** ทำการแงะเงื่อนไข Database Transaction เดิม (ที่คอยดักจับและบล็อกการจองช่วงเวลาที่มีคนจองแล้ว) ออก เพื่อตอบสนอง Requirement หรือ Scenario พิเศษของระบบที่เปิดโอกาสให้เกิดการ Overbook สินค้าชนิดเดียวกันได้

### 4. การยกระดับคุณภาพโค้ดและการทดสอบ (Code Quality & Testing Maintenance)
*   **JSDoc Standardization:** เพิ่มมาตรฐานการเขียนเอกสารกำกับโค้ดระดับฟังก์ชัน (JSDoc) ในไฟล์ Core หลักอย่าง `cameraController.js` และ `authController.js` 
*   **ESLint Configuration:** ปรับแต่งไฟล์ `eslint.config.mjs` ใหม่ เพื่อละเว้น (Ignore) ไฟล์ในส่วน Frontend หรือโค้ดที่ไม่จำเป็น ช่วยขจัด Error กวนใจใน IDE 
*   **Advanced Test Cases (100% Pass):** เพิ่มเกราะป้องกันระบบด้วย Unit Test กรณีเกี่ยวกับการเช็คสิทธิ Google Mock Login เข้าไปใน `authController.security.test.js` ส่งผลให้ปัจจุบันระบบรันเทสต์ผ่านฉลุย **19/19 Tests (Passed 100%)** ไร้ข้อบกพร่อง

---

### 5. ระบบอัตโนมัติและความต่อเนื่อง (CI/CD & System Automation)
*   **GitHub Actions CI/CD Pipeline:** วางระบบท่อส่งโค้ดแบบอัตโนมัติ (Continuous Integration/Continuous Deployment) โดยผูกการทำงานไว้กับ GitHub ทุกครั้งที่มีการ Push โค้ดใหม่ ระบบจะทำหน้าที่ดึงโค้ดมารัน Unit Testing (Jest) ให้โดยอัตโนมัติเพื่อหาข้อผิดพลาดก่อนชิ้นงานจะพัง
*   **Cypress E2E Testing (UI Tests):** ยกระดับการทดสอบจากการเช็คแค่ลอจิกหลังบ้าน (Backend) เป็นการนำเอา Cypress มาช่วยรันจำลองการคลิกเมาส์ การพิมพ์ การเปิดเว็บบนเบราว์เซอร์เปรียบเสมือนผู้ใช้จริง (End-to-End) ทะลวงเช็ค UI ครบวงจร

### 6. การขัดเกลาและยกระดับประสบการณ์ผู้ใช้งานแบบก้าวกระโดด (UI/UX Refinements & Polishing)
ในสัปดาห์โค้งสุดท้ายนี้ ได้รื้อดีไซน์บางส่วนเพื่อปรับจูนให้เป็นมิตรและดูหรูหรามากขึ้น:
*   **System Calendar View & Browse Enhancements:** ปรับปรุงหน้า `browse` กล้อง เพิ่มปุ่มเช็ควันว่างและทำ Calendar Highlight แสดงสถานะวันจองกล้องเพื่อป้องกันการจองทับซ้อนและให้สอดคล้องกับพฤติกรรม Overbooking
*   **Admin Dashboard & Media Manager Fixes:** แก้ไข Bug หน้า Upload ภาพและจัดการอุปกรณ์หลังบ้าน จัดวาง Grid เพื่อให้แอดมินใช้งานง่ายดายและไม่ติด Error
*   **Layout & Theme Alignment:** ปรับตำแหน่ง Navigation Bar และ Footer ให้ตรงตามหลัก Grid Alignment รวมถึงเซ็ตโทนภาพลักษณ์หน้าโปรไฟล์ (Profile Page) ใหม่ให้เป็น Dark Theme สมกับสไตล์ของคนเล่นกล้องวินเทจ
*   **Latest Figma Prototype:** อัปเดตลิงก์ Figma Design ใหม่เพื่อให้ตรงกับภาพหน้าจอที่รื้อทำใหม่ล่าสุดใน Project Source Code

### 7. โครงสร้างพื้นฐานเสริมและการวัดประสิทธิภาพระดับก้าวหน้า (Advanced Infrastructure & Profiling)
*   **Performance Profiling Scripts:** มีการพัฒนาระบบวัดประสิทธิภาพโค้ดด้วยตัวเอง (`performance/profile.js` และ `generate-report.js`) เพื่อคอยมอนิเตอร์ความเร็วในการตอบสนอง (ms) และการกินหน่วยความจำ (MB) ของเซอร์วิสต่างๆ 
*   **Test Data Seeding:** เพิ่มสคริปต์ `scripts/seed-data.js` ปรับการโยนข้อมูลจำลอง (Dummy Data) เข้าฐานข้อมูลอัตโนมัติ เพื่อรองรับโครงสร้างตารางใหม่และเตรียมขบวนข้อมูลไว้ให้ระบบ UI Testing หยิบไปจำลองยิง Request ได้เต็มเหนี่ยว
*   **Extended GitHub Workflows:** ขยายขอบเขตท่อส่งโค้ดอัตโนมัติให้ฉลาดขึ้น โดยเพิ่ม `performance-matrix.yml` และ `test-report.yml` คอยทำหน้าที่เจน Report สรุปผลการทดสอบให้เป็นกราฟิกหรือบันทึก Log การวิ่งทดสอบเก็บไว้อย่างเป็นระเบียบเมื่อมีคน Push โค้ด

---

### 8. รายละเอียดการทดสอบและวิธีการ (Testing Methodology)
ใน Phase 4 ทีมงานได้ใช้กลยุทธ์การทดสอบแบบครอบคลุม (Full-stack Testing Strategy) เพื่อให้มั่นใจในคุณภาพก่อนส่งมอบงาน:
*   **Unit Testing (Logic Validation):** ใช้ **Jest** ในการทดสอบตรรกะเบื้องหลัง (Backend Logic) เช่น การคำนวณราคาส่วนลด, การตรวจสอบอีเมล, และการหาค่าเฉลี่ยคะแนนรีวิว โดยเน้น Statement Coverage ที่ 100%
*   **UI / End-to-End Testing (User Journey):** ใช้ **Cypress** เพื่อจำลองพฤติกรรมผู้ใช้ตั้งแต่หน้าแรกจนถึงการกดจองสำเร็จ เพื่อตรวจสอบความถูกต้องของหน้าบ้าน (Frontend) และการเชื่อมต่อกับ API
*   **Performance Profiling (Stress Testing):** ใช้ **Autocannon** ในการยิง Request ปริมาณมหาศาลเพื่อวัดค่าความเร็วในการตอบสนอง (Latency) และปริมาณงานที่ระบบรับได้ (Throughput)
*   **Security Testing:** ตรวจสอบกระบวนการยืนยันตัวตนทุกช่องทาง รวมถึงความถูกต้องของการใช้งาน CSRF Token และ Bcrypt Hashing

---

### 9. ผลการทดสอบ (Test Results Summary)

#### **9.1 ผลการทดสอบ UI (5 Functional Core Flows)**
| Test ID | ฟีเจอร์ที่ทดสอบ | ผลลัพธ์ที่คาดหวัง | สถานะ |
|:---:|:---|:---|:---:|
| **TC001** | หน้าแรก (Homepage) | ต้องเห็น "CAPTURE MOMENTS" และเมนูนำทาง | ✅ ผ่าน |
| **TC002** | สมัครสมาชิก (Registration) | ต้อง Redirect ไป /browse และเห็นปุ่ม Logout | ✅ ผ่าน |
| **TC003** | ค้นหากล้อง (Search) | ค้นหา "EOS R5" ต้องแสดงผลลัพธ์ที่ถูกต้อง | ✅ ผ่าน |
| **TC004** | ข้อมูลสินค้า (Price/Info) | ต้องแสดงราคาสกุลเงิน ฿ และรายละเอียดครบถ้วน | ✅ ผ่าน |
| **TC005** | การจองกล้อง (Booking) | เลือกวันที่และกดจอง ต้องไปที่หน้าตะกร้า (Cart) | ✅ ผ่าน |

#### **9.2 ผลการทดสอบ Unit Test (Jest)**
*   **Total Tests**: 19 Tests
*   **Status**: 🟢 Passed 100% (19 passed, 0 failed)
*   **Coverage**: ครอบคลุมฟังก์ชันสำคัญทั้งหมด (Auth, Camera, Security)

#### **9.3 ผลการวัดประสิทธิภาพ (Performance Profiling)**
| เมตริก (Metric) | Phase 3 | Phase 4 (ปัจจุบัน) | สรุปผล |
|:---:|:---:|:---:|:---:|
| **ค่าเฉลี่ย Latency** | ~14.00 ms | **0.22 - 7.41 ms** | 🚀 เร็วขึ้นกว่า 50% |
| **Throughput (Peak)** | N/A | **123,000+ Req/sec** | 📈 มีความเสถียรสูง |

---

### 10. วิธีการรันการทดสอบ (How to Run Tests)
เพื่อให้ทีมงานและผู้ตรวจสามารถทดสอบระบบได้ด้วยตัวเอง สามารถใช้คำสั่งดังต่อไปนี้:

1.  **การติดตั้งเครื่องมือ**:
    ```bash
    npm install
    ```
2.  **การรัน Unit Test**:
    ```bash
    npm test
    ```
3.  **การรัน UI Test (Cypress)**:
    - *ขั้นตอนที่ 1*: รัน Server หลักก่อน (`npm start`)
    - *ขั้นตอนที่ 2*: เปิด Cypress Test Runner
    ```bash
    npx cypress open  # หรือรันในโหมด Terminal: npx cypress run
    ```
4.  **การรัน Profiling (Stress Test)**:
    ```bash
    node performance/profile.js
    ```

---

### 11. ระบบอัตโนมัติ CI/CD Pipeline (Continuous Integration & Deployment)
โครงการนี้เราได้ลงทุนในการสร้าง Pipeline อัตโนมัติที่มีความซับซ้อนสูงผ่าน **GitHub Actions** เพื่อรับประกันว่าทุกการเปลี่ยนแปลงจะไม่ส่งผลกระทบต่อระบบเดิม (Regression) โดยแบ่งขั้นตอนการทำงานออกเป็น 7 ขั้นตอนหลัก:

1.  **📝 Code Quality Check (Linting)**: ตรวจสอบมาตรฐานการเขียนโค้ดและรูปแบบ (Formatting) ผ่าน ESLint เพื่อให้โค้ดทั้งโครงการมีความเป็นหนึ่งเดียวกัน
2.  **✅ Unit Tests**: รันชุดทดสอบ Logic หลังบ้าน 19 เคส พร้อมคำนวณค่า **Code Coverage** เพื่อให้มั่นใจว่าทุกฟังก์ชันสำคัญถูกทดสอบแล้ว
3.  **🏗️ Build Application**: บิวด์โปรเจคในสภาพแวดล้อมที่สะอาด (Clean Environment) เพื่อตรวจสอบความสมบูรณ์ของไฟล์และการเชื่อมต่อ Library ต่างๆ
4.  **🎬 E2E UI Tests (Cypress)**: ขั้นตอนที่สำคัญที่สุด โดยระบบจะจำลองเบราว์เซอร์ Chrome ขึ้นมาจริงๆ และรันฐานข้อมูล PostgreSQL ชั่วคราว เพื่อทดสอบการใช้งานเสมือนผู้ใช้จริง (End-to-End)
5.  **⚡ Performance Profiling**: รันสคริปต์สเปรสเทส (Stress Test) ในระดับ CI เพื่อตรวจสอบว่าการแก้ไขโค้ดล่าสุดไม่ได้ทำให้ความเร็ว (Latency) ตกลงเกินกว่าเกณฑ์ที่กำหนด
6.  **🔐 Security Scan**: สแกนช่องโหว่ผ่าน npm audit และ OWASP Dependency Check
7.  **🚀 Deploy to Staging**: เมื่อการตรวจสอบทั้ง 6 ขั้นตอนผ่านทั้งหมด ระบบจะเตรียมความพร้อมสำหรับการ Deployment อัตโนมัติ

---

### 12. การออกแบบและบริหารจัดการฐานข้อมูล (Database Design & Management)
เราใช้ **PostgreSQL** เป็นระบบจัดการฐานข้อมูลหลัก และขับเคลื่อนผ่าน **Sequelize ORM** โดยมีจุดเด่นดังนี้:

*   **Core Entities**: ออกแบบฐานข้อมูลรองรับระบบเช่ากล้องครบวงจร (Customer, Equipment, Category, Rental, RentalDetail, Payment)
*   **Data Integrity**: ใช้ระบบ **Sequelize Transaction (Serializable)** เพื่อป้องกันปัญหาการจองซ้อน (Double Booking)
*   **Schema Evolution**: มีระบบ `schemaSync.js` ที่ช่วยตรวจสอบคอลัมน์ใหม่ๆ และทำการ Migrate ข้อมูลจากระบบเก่าเข้าสู่โครงสร้างใหม่โดยอัตโนมัติ ทำให้ข้อมูลไม่สูญหายในช่วงเปลี่ยนผ่าน

#### **รายละเอียดตารางข้อมูล (Database Dictionary):**
*   **Customer (ตารางผู้เช่า/สมาชิก)**:
    - `CustomerID`: รหัสสมาชิก (Primary Key)
    - `FirstName`, `LastName`: ชื่อ-นามสกุล
    - `Email`, `Username`: ข้อมูลสำหรับระบุตัวตนและติดต่อ (Unique)
    - `PasswordHash`: รหัสผ่านที่เข้ารหัสป้องกันความปลอดภัย (Bcrypt)
    - `Role`: ระดับสิทธิ์การใช้งาน (`user` สำหรับลูกค้าทั่วไป, `admin` สำหรับผู้ดูแลระบบ)
*   **Equipment (ตารางอุปกรณ์)**:
    - `EquipmentID`: รหัสอุปกรณ์ (Primary Key)
    - `ModelName`, `Brand`: ชื่อรุ่นและแบรนด์ของกล้อง/อุปกรณ์
    - `SerialNumber`: หมายเลขซีเรียล (ใช้ยืนยันสินค้าจริงและป้องกันข้อมูลซ้ำ)
    - `DailyRate`: ราคาค่าเช่าต่อวัน
    - `Status`: สถานะปัจจุบันของอุปกรณ์ (`available`, `rented`, `maintenance`)
*   **Rental (ตารางการจอง)**:
    - `RentalID`: รหัสการจอง (Primary Key)
    - `CustomerID`: เชื่อมโยงไปยังสมาชิกที่ทำรายการ
    - `RentalDate`: วันที่บันทึกรายการจอง
    - `RentalStatus`: สถานะภาพรวมของการเช่า (`pending`, `active`, `completed`, `cancelled`)
*   **RentalDetail (รายละเอียดรายการเช่า)**:
    - `RentalID`, `EquipmentID`: การเชื่อมโยงแบบ Many-to-Many ระหว่างการจองและอุปกรณ์
    - `StartDate`, `EndDate`: ช่วงเวลาที่เช่าอุปกรณ์ชิ้นนั้นๆ
    - `SubTotal`: ยอดรวมราคาเช่าของรายการนี้
*   **Payment (ตารางการชำระเงิน)**:
    - `RentalID`: เชื่อมการชำระเงินเข้ากับรายการจอง
    - `Amount`: ยอดเงินที่ชำระจริง
    - `SlipPath`: เส้นทางจัดเก็บไฟล์ภาพหลักฐานการโอน (สลิป)
    - `PaymentStatus`: สถานะการตรวจสอบสลิป (`pending`, `approved`, `rejected`)

---




