# Camera Rental System (ระบบเช่ากล้อง) - Project Summary

##  สรุปการดำเนินงาน Phase 1 & 2

###  Phase 1: การวิเคราะห์ความต้องการและการสำรวจ (Analysis & Requirement)
ในเฟสแรก ทีมงานได้ทำการรวบรวมข้อมูลและวิเคราะห์ความต้องการเพื่อวางรากฐานของโครงการ:
*   **Problem Statement:** แก้ไขปัญหาความยุ่งยากในการจัดการคลังสินค้าและความผิดพลาดในการคำนวณค่าเช่า/ค่าปรับของร้านเช่ากล้อง
*   **Objectives:** สร้างระบบที่จองง่าย (3-4 ขั้นตอน), รองรับมือถือ, คำนวณเงินอัตโนมัติ และจัดการสต็อกแบบ Real-time
*   **Functional Requirements:** 
    *   **ผู้เช่า:** สมัครสมาชิก, ค้นหาและกรองกล้อง, จองออนไลน์, แนบหลักฐานการโอนเงิน และดูประวัติ
    *   **Admin:** จัดการคลังสินค้า (CRUD), อนุมัติการจอง, อัปเดตสถานะรับ/คืน และดู Dashboard สรุปรายได้
*   **Non-Functional Requirements:** เน้นความรวดเร็วในการโหลด (<3 วินาที), ความปลอดภัยของข้อมูล (Encryption) และระบบป้องกันการจองซ้อน (Double Booking Prevention)

###  Phase 2: การออกแบบระบบและวางแผน (System Design & Planning)
เฟสที่สองเป็นการเปลี่ยนความต้องการให้เป็นโครงสร้างทางเทคนิคและการออกแบบ:
*   **Use Case Modeling:** กำหนดปฏิสัมพันธ์ระหว่างผู้เช่าและ Admin ผ่าน Use Case Diagram
*   **UI/UX Design:** พัฒนาตัวต้นแบบ (Prototype) บน Figma เพื่อทดสอบขั้นตอนการจองที่กระชับและสวยงาม
*   **Class Structure:** แบ่งความรับผิดชอบในระดับ Class (Inventory, Booking Queue, User Registry) ตามรายบุลคลในทีม
*   **Methodology:** ใช้กระบวนการ Agile (Scrum) มีการประชุมยืนคุยและสรุปผล (Retrospective) อย่างต่อเนื่อง

---

#  Database Documentation (Phase 3)

## 🏗️ โครงสร้างทางเทคนิคและสถาปัตยกรรมเชิงลึก (Detailed Technical Architecture)

ระบบใน Phase 3 ถูกพัฒนาด้วยโครงสร้างที่รองรับการขยายตัวและมีความเป็นระเบียบสูง โดยสรุปรายละเอียดการทำงานได้ดังนี้:

### 1. สถาปัตยกรรม MVC (Model-View-Controller)
ระบบแยกส่วนการทำงานออกจากกันอย่างชัดเจนตามมาตรฐานอุตสาหกรรม:
*   **Model:** ทำหน้าที่จัดการข้อมูลเปรียบเสมือนโกดัง (ปัจจุบันใช้ PostgreSQL ผ่าน Sequelize เป็นหลัก)
*   **View:** ส่วนแสดงผลหน้าบ้าน (Frontend) โดยใช้ EJS เพื่อสร้าง HTML แบบ Dynamic
*   **Controller:** ส่วนประมวลผลตรรกะหลัก (Brain) รับคำสั่งจากหน้าบ้านไปติดต่อกับ Model และส่งข้อมูลกลับไปแสดงผล
*   **Router:** ประสานงานการรับคำขอ (Request) จาก URL ใน `app.js` เพื่อกระจายงานไปยัง Controller ที่เหมาะสม

### 2. เจาะลึกระบบหลังบ้าน (Core Backend Engine)
ผ่านไฟล์ `app.js` ที่เป็นศูนย์กลางการตั้งค่าสภาพแวดล้อม:
*   **EJS View Engine:** ตั้งค่าให้เรนเดอร์หน้าเว็บที่สามารถแทรกตัวแปร JavaScript ได้โดยตรง
*   **Body Parsers:** ใช้ Middleware จัดการข้อมูลจาก Form (`urlencoded`) เพื่อให้อ่านค่าผ่าน `req.body` ได้อย่างแม่นยำ
*   **Session Management:** ใช้ระบบ `express-session` ในการจดจำตัวตนผู้ใช้ผ่าน Cookie เพื่อแยกแยะสิทธิ์ระหว่าง **User** และ **Admin** ตลอดการใช้งาน

### 3. ระบบจัดการข้อมูลและตรรกะควบคุม (Model & Controller Layer)
*   **Memory-based Data:** จำลองฐานข้อมูลด้วย JavaScript Array (`cameras`, `bookings`) ช่วยให้พัฒนาระบบได้อย่างรวดเร็วก่อนนำ PostgreSQL เข้ามาใช้งานจริง
*   **Authentication & Guards:** มีระบบ `authController` ที่ดูแลทั้งการล็อกอินแบบปกติและแบบจำลอง Google Login พร้อม Middleware (`requireAuth`, `requireAdmin`) ที่ทำหน้าที่เป็น "ยามเด้าหน้าประตู" เพื่อป้องกันการเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต
*   **Camera Logic:** ระบบค้นหาที่รองรับการพิมพ์แบบ Case-insensitive (พิมพ์เล็ก-ใหญ่ก็ได้) และระบบจองที่รองรับกรณี **Overbooking** ตามความต้องการของระบบจำลอง

### 4. ระบบแสดงผลและส่วนประสานงานผู้ใช้ (View & Frontend Logic)
*   **Dynamic Rendering:** ใช้ EJS Loop วางโครงสร้างการ์ดสินค้าอัตโนมัติ พร้อมกำหนด Unique ID ให้กับ Input ของกล้องแต่ละตัวเพื่อป้องกันข้อมูลตีกัน
*   **Client-side Calculation:** มีระบบ JavaScript คำนวณราคาสุทธิทันทีเมื่อผู้ใช้เลือกวันเริ่มต้นและวันสิ้นสุด พร้อมระบบ **Date Validation** ที่จะล็อกปุ่มจอง (Disable) หากเลือกวันที่ผิดพลาดหรือไม่เหมาะสม
*   **Modern Styling:** ใช้ TailwindCSS ในการออกแบบ Layout แบบ Grid และ Flexbox ที่รองรับ Responsive Design (แสดงผลต่างกันระหว่างมือถือและคอมพิวเตอร์) พร้อมการตกแต่งด้วย Linear Gradients และ Shadow เพื่อความสวยงามระดับ Premium

---

ระบบเช่ากล้องที่ออกแบบด้วยสถาปัตยกรรม Model-Driven และทดสอบด้วย Unit Testing (Jest) โดยใช้ PostgreSQL เป็นระบบจัดการฐานข้อมูล

---

##  Database Structure (Schema)

ระบบประกอบด้วย 6 ตารางหลักที่ทำงานสัมพันธ์กัน ดังนี้

### 1. Users (ผู้ใช้)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `username` | String | ชื่อผู้ใช้งาน |
| `email` | String | อีเมล (Unique) |
| `password` | String | รหัสผ่าน (Hashed) |
| `role` | Enum | สิทธิ์การใช้งาน (customer, admin) |

### 2. Cameras (กล้อง)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `model_name` | String | ชื่อรุ่นกล้อง |
| `brand` | String | ยี่ห้อ |
| `daily_rate` | Decimal | ราคาเช่าต่อวัน |
| `status` | Enum | สถานะ (available, rented, maintenance) |

### 3. Bookings (การจอง)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `user_id` | FK | เชื่อมกับ Users |
| `camera_id` | FK | เชื่อมกับ Cameras |
| `start_date` | Date | วันที่เริ่มเช่า |
| `end_date` | Date | วันที่สิ้นสุด |
| `total_price` | Decimal | ราคาสุทธิ |

### 4. Orders (คำสั่งเช่าจริง)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `booking_id` | FK | เชื่อมกับการจอง |
| `actual_return` | Date | วันที่คืนจริง |
| `late_fee` | Decimal | ค่าปรับกรณีคืนช้า |

### 5. Payments (การชำระเงิน)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `booking_id` | FK | เชื่อมกับการจอง |
| `amount` | Decimal | ยอดเงินที่ชำระ |
| `status` | Enum | สถานะ (pending, paid, failed) |

### 6. Promotions (โปรโมชั่น)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / INT | Primary Key |
| `code` | String | รหัสส่วนลด |
| `discount` | Integer | เปอร์เซ็นต์ส่วนลด |

---

## Entity Relationship Diagram (ERD)

> **คำอธิบายความสัมพันธ์ (Relationships):**
> * **One-to-Many (Users & Bookings):** ผู้ใช้ 1 คน สามารถทำการจองได้หลายครั้ง
> * **One-to-Many (Cameras & Bookings):** กล้อง 1 ตัว สามารถถูกจองได้หลายช่วงเวลา
> * **One-to-One (Bookings & Payments):** การจอง 1 ครั้ง จะมีรายการชำระเงินที่สัมพันธ์กันเพียง 1 รายการ
> * **One-to-One (Bookings & Orders):** การจอง 1 ครั้ง จะเปลี่ยนเป็นคำสั่งเช่า 1 รายการเมื่อมีการรับของ

## Unit Test Cases
| Test Case | Description | Expected Result | Status |
|---|---|---|---|
| TC-01 | Email Validation - Should fail if email is invalid (no @ symbol) | Email validation fails for invalid format | ✓ Pass |
| TC-02 | Negative Price Check - Should throw error for negative daily rate | Throw error: "Price or days cannot be negative" | ✓ Pass |
| TC-03 | Date Constraint - End date cannot be before or same as start date | Validation returns false for invalid date range | ✓ Pass |
| TC-04 | Price Calculation - Should calculate total price correctly | $500 * 3 days = $1,500 | ✓ Pass |
| TC-05 | Member Discount - Gold members get 10% discount | $1,000 * 0.9 = $900 | ✓ Pass |
| TC-06 | Stock Check - Cannot book if camera status is maintenance | Booking returns false for maintenance status | ✓ Pass |
| TC-07 | Status Transition - When booking succeeds, camera status changes to rented | Status updates from 'available' to 'rented' | ✓ Pass |
| TC-08 | Promo Expiry - Expired promo codes cannot be used | Expired date is before current date | ✓ Pass |
| TC-09 | Email Uniqueness - Email should be unique | Duplicate email detected in system | ✓ Pass |
| TC-10 | Late Fee Calculation - Calculate late return fee at 200 per day | 3 days overdue × 200 = 600 | ✓ Pass |

## Test Coverage Report
- Coverage: 100% (statement)
- Coverage Tools: Jest/Istanbul
- Details: 
    - Total Test Suites: 6 passed (100%)
    - Total Test Cases: 11 passed (100%)
    - Files Covered: ครอบคลุมไฟล์ Logic หลักทั้งหมด 6 ไฟล์ (booking.js, camera.js, index.js, payment.js, promotion.js, user.js)

Summary: โค้ดทั้งหมดได้รับการทดสอบแบบ Full Coverage (Statements, Branches, Functions, และ Lines มีค่าเป็น 100% ทั้งหมด) ไม่พบส่วนของโค้ดที่ยังไม่ถูกเข้าถึง (Uncovered Lines)

## Performance Analysis
### Static Profiling
| Metric | Value |
|---|---|
| Lines of Code | 29,484 |
| Duplicated Lines | 6.08% |
| Total Files Analyzed | 237 |
| Complexity (Avg) | 3-5 |
| Linting Errors | 0 |


### Dynamic Profiling
| Operation | Time (ms) | Memory (MB) |
|---|---|---|
| Create User | 14.64 ms | 0.33 MB |
| Create Camera | 14.80 ms | 0.10 MB |
| Create Booking | 12.62 ms | 0.17 MB |

## Known Issues & Bugs
| Bug ID | Description | Severity | Status | Issue # |
|---|---|---|---|---|
| None | None | None | None | None |

---

## สิ่งที่พัฒนาเพิ่มเติมจาก Phase 1-2 (Extra Developments)

จากการวางแผนใน Phase 1-2 ทีมงานได้มีการพัฒนาและปรับเปลี่ยนในเชิงเทคนิคเพิ่มเติมเพื่อให้ระบบมีประสิทธิภาพสูงขึ้นดังนี้:
*   **Database Implementation:** เปลี่ยนจากการจัดการข้อมูลเบื้องต้นเป็นการใช้ **PostgreSQL** แบบ Relational Database เต็มรูปแบบ เพื่อรองรับความสัมพันธ์ของข้อมูลที่ซับซ้อน
*   **Quality Assurance:** เพิ่มระบบ **Unit Testing ด้วย Jest** เพื่อตรวจสอบความถูกต้องของ Logic การคำนวณและสถานะต่างๆ โดยอัตโนมัติ
*   **Promotion System:** พัฒนาระบบส่วนลด (Promotions) เพิ่มเติมจากแผนเดิม เพื่อช่วยกระตุ้นยอดเข่าและให้ Admin จัดการโปรโมชั่นได้ยืดหยุ่นขึ้น
*   **Workflow Automation:** ออกแบบให้ระบบเชื่อมโยงระหว่างการจอง (Booking), การชำระเงิน (Payment) และการรับของ (Order) อย่างไร้รอยต่อ

## ความคาดหวังของโครงการ (Project Expectations)

*   **Data Integrity:** ข้อมูลการจองและสถานะกล้องในระบบต้องมีความถูกต้อง 100% ไม่เกิดการจองซ้อน (Double Booking)
*   **User Experience:** ผู้ใช้งานสามารถทำรายการได้ราบรื่น ระบบทำงานได้รวดเร็วตามที่กำหนดไว้ใน Non-Functional Requirement
*   **Scalability:** สถาปัตยกรรม Model-Driven ที่ออกแบบไว้จะช่วยให้เราสามารถเพิ่มฟีเจอร์ใหม่ๆ เช่น ระบบ Review หรือระบบสมาชิก VIP ได้ง่ายในอนาคต
*   **Efficiency:** ลดภาระงานของ Admin ด้วยการคำนวณค่าปรับและสรุปรายได้อัตโนมัติที่แม่นยำ