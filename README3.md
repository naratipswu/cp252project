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
