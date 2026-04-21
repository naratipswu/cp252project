# กระบวนการทำงาน ระยะที่ 4 (Phase 4: Optimization, Testing & CI/CD)

เอกสารฉบับนี้อธิบายถึงกระบวนการทำงาน (Process), วิธีการ (Methods) และเครื่องมือ (Tools) ที่พัฒนาต่อยอดมาจาก Phase 1, 2 และ 3 

---

## 🏗️ การพัฒนาต่อยอดจาก Phase 1-3

| หัวข้อ | Phase 1 - 3 (ตรรกะและโครงสร้าง) | Phase 4 (ประสิทธิภาพและการรับประกันคุณภาพ) |
|:---:|:---|:---|
| **การจัดการงาน** | ใช้ GitHub Projects สำหรับ Todo/Doing/Done | เข้มงวดเรื่อง **Definition of Done (DoD)** โดยใช้ CI/CD เป็นเกณฑ์ |
| **การทดสอบ** | เน้น Unit Testing (Jest) ในระดับ Logic | เพิ่ม **E2E Testing (Cypress)** เพื่อทดสอบ Flow การใช้งานจริงของ User |
| **ประสิทธิภาพ** | วิเคราะห์ Static (Lines of Code, Complexity) | ทำ **Dynamic Profiling (Autocannon)** วัด Throughput/Latency |
| **การตรวจสอบ** | ตรวจสอบ Code รีวิวโดยคน | ใช้ **GitHub Actions (Auto-Build & Lint)** ตรวจสอบทุกครั้งที่ Push |

---

## 1. การบริหารจัดการโปรเจกต์ (Project Management)
ใน Phase 4 เราไม่ได้เพียงแค่แบ่งงานด้วยสถานะ แต่เราใช้ **AI-Augmented Management**:
- **Task Verification**: ใช้ `task.md` ในการกำกับดูแลสถานะงานแบบ Real-time ร่วมกับ AI Assistant
- **Implementation Planning**: ทุกการเปลี่ยนแปลงสำคัญจะถูกผ่านกระบวนการทำ `implementation_plan.md` เพื่อประเมินผลกระทบก่อนเริ่มทำจริง
- **Git Standards**: บังคับใช้การตั้งชื่อ Commit และ Branch ตามมาตรฐานที่วางไว้ใน Phase 2 อย่างเคร่งครัด เพื่อรองรับการทำงานของ CI/CD

## 2. การเฝ้าสังเกตการณ์การสร้างระบบ (Build Monitoring)
เราก้าวข้ามจาก "การรันบนเครื่องตัวเอง" ไปสู่ **Automated Pipeline**:
- **CI/CD Pipeline**: ใช้ GitHub Actions ในการ Monitor build ทุกครั้งที่มีการ Commit โค้ดผ่านไฟล์ `.github/workflows/ci-cd.yml`
- **Build Logs Analysis**: เมื่อระบบทำงานผิดพลาด เราใช้ Build Logs จาก GitHub Actions ในการวิเคราะห์หาสาเหตุของ Failure แทนการไล่หาใน Local เครื่องเดียว
- **Parallel Monitoring**: ใช้ Matrix Strategy ในการรัน Performance Test หลายจุดพร้อมกัน เพื่อสรุปผลความเสถียรของ Build ในภาพรวม

## 3. การจัดการข้อผิดพลาด (Bug Management)
เราเปลี่ยนวิธีการแก้ Bug จากการ "เดาสุ่ม" เป็น **Evidence-based Debugging**:
- **E2E Failure Evidence**: เมื่อเทสไม่ผ่านใน Cypress ระบบจะบันทึก **Screenshots และ Videos** ของจุดที่ Error โดยอัตโนมัติ ทำให้ระบุจุดที่ UI พังได้อย่างแม่นยำ
- **Automated Verification**: เมื่อ Bug ถูกแก้ไข เราจะรัน suite เทสทั้งหมดซ้ำด้วย `npm run test:ui` เพื่อทำ Regression Testing (มั่นใจว่าแก้จุดนี้แล้วไม่ไปพังจุดอื่น)
- **Code Linting**: ใช้ **ESLint** เป็นตัวดักจับ Syntax Error และ Coding Standard ตั้งแต่ขั้นตอนการ Build เพื่อลด Human Error ก่อนถึงมือผู้ใช้

## 4. เครื่องมือและวิธีการเพิ่มเติม (Methods & Tools Upgrade)
- **Performance Profiling**: เครื่องมือ **Autocannon** ถูกนำมาใช้เพื่อทำ Stress Test หาจุดขวดทอง (Bottleneck) ของ Server
- **Cypress (Headless Mode)**: ใช้รันการทดสอบ UI ในรูปแบบอัตโนมัติโดยไม่ต้องเปิด Browser จริง ลดระยะเวลาในการเทสซ้ำๆ
- **GitHub Actions (CI)**: เป็น "หุ่นยนต์พนักงาน" ที่ช่วยตรวจสอบ Lint, Unit Tests, และ E2E Tests ให้เราตลอด 24 ชั่วโมง

---
**สรุป**: Phase 4 คือการนำโค้ดที่ "ทำงานได้" จาก Phase 3 มาผ่านกระบวนการ "ทำให้มั่นใจและมีประสิทธิภาพ" (Industrialization) เพื่อให้แอปพลิเคชันมีความทนทานและพร้อมใช้งานในสเกลที่ใหญ่ขึ้น
