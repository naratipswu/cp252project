# ข้อมูลการทำ CI/CD และการทำงานของ Pipeline

เอกสารฉบับนี้อธิบายถึงกลยุทธ์การทำ Continuous Integration (CI) และ Continuous Deployment (CD) ของโปรเจกต์ Camera Rental System โดยใช้ GitHub Actions ในการทำงานแบบอัตโนมัติ

---

## 🚀 CI/CD ในโปรเจกต์นี้คืออะไร?

- **Continuous Integration (CI)**: คือกระบวนการสร้าง (Build), ทดสอบ (Test), และตรวจสอบคุณภาพโค้ด (Lint) โดยอัตโนมัติทุกครั้งที่มีการ Push โค้ดใหม่ขึ้นไป เพื่อให้แน่ใจว่าโค้ดใหม่จะไม่ทำให้ระบบเดิมพัง
- **Continuous Deployment (CD)**: คือกระบวนการเตรียมแอปพลิเคชันให้พร้อมสำหรับการใช้งานจริง หรือ Deploy ไปยัง Staging environment โดยอัตโนมัติหลังจากที่ผ่านการตรวจสอบ CI ครบทุกขั้นตอนแล้ว

---

## 🛠 โครงสร้างของ CI/CD (Pipeline)

เราใช้ **GitHub Actions** เป็นเครื่องมือหลักในการจัดการ Pipeline ซึ่งถูกกำหนดไว้ในสคริปต์ที่ `.github/workflows/ci-cd.yml`

### 1. การทำงานแบบลำดับและแบบขนาน (Sequential & Parallel)
Pipeline ของเราถูกออกแบบมาให้มีประสิทธิภาพสูงสุด โดยใช้การผสมผสานระหว่างการทำงานแบบต้องรอกัน (Sequential) และการทำงานพร้อมกัน (Parallel)

| ขั้นตอน | ชื่อ Job | เงื่อนไข (Dependency) | วัตถุประสงค์ |
|:---:|:---|:---|:---|
| **1** | `lint` | - | ตรวจสอบคุณภาพโค้ดด้วย ESLint เพื่อความเรียบร้อยของสไตล์โค้ด |
| **2** | `unit-tests` | `lint` | รัน Unit Tests เพื่อเช็คฟังก์ชันการทำงานพื้นฐาน |
| **3** | `security` | `lint` | สแกนช่องโหว่ด้วย `npm audit` โดยทำงาน **ขนาน (Parallel)** ไปกับ Tests |
| **4** | `build` | `lint`, `unit-tests` | ตรวจสอบว่าแอปพลิเคชันสามารถติดตั้งและติดตั้ง Dependencies ได้ครบถ้วน |
| **5** | `e2e-tests` | `build` | รัน UI Tests เต็มระบบด้วย **Cypress** |
| **6** | `performance` | `build` | ตรวจสอบประสิทธิภาพ (Profiling) เพื่อไม่ให้ระบบช้าลงจากโค้ดใหม่ |
| **7** | `deploy` | ผ่านทุกขั้นตอนข้างต้น | แจ้งเตือนความสำเร็จและเตรียมการนำขึ้นระบบจริง |

---

## ⚡ การเพิ่มสปีดการทดสอบด้วย Matrix (Parallel Jobs)

เพื่อให้การทดสอบรวดเร็วขึ้น เราได้ใช้ความสามารถของ **Free Tier Parallel Job** ใน GitHub Actions ผ่านฟีเจอร์ `strategy: matrix`

### สคริปต์ที่ใช้: `performance-matrix.yml`
ในไฟล์ [performance-matrix.yml](file:///.github/workflows/performance-matrix.yml) เราใช้ Matrix เพื่อทดสอบหลายๆ Endpoints พร้อมกันในเวลาเดียว:

```yaml
strategy:
  matrix:
    endpoint: [homepage, cameras, search, admin]
```

> [!TIP]
> **ทำไมต้องใช้ Parallel Jobs?**
> การรัน Test ของแต่ละ Endpoint พร้อมกันใน "Runner" ตัวอื่นแยกกัน จะช่วยลดเวลารวมของการทดสอบจากหลายนาทีเหลือเพียงไม่กี่วินาที ซึ่งฟีเจอร์นี้เป็นจุดเด่นของ **GitHub Actions Free Tier** ที่ยอมให้รันงานพร้อมกันได้สูงสุดถึง 20 Jobs สำหรับ Public Repository

---

## 📂 สคริปต์ที่ใช้งานจริง

1. **Main CI/CD**: [.github/workflows/ci-cd.yml](file:///.github/workflows/ci-cd.yml) - จัดการวงจรชีวิตทั้งหมดตั้งแต่โค้ดถูกส่งขึ้นไปจนถึงขั้นเตรียม Deploy
2. **Performance Matrix**: [.github/workflows/performance-matrix.yml](file:///.github/workflows/performance-matrix.yml) - สาธิตการทำ Profiling ความเร็วสูงแบบขนานในหลายส่วนของระบบ

---

## ✅ ประโยชน์ที่ได้รับ
- **รู้ผลไว**: นักพัฒนาจะรู้ได้ทันทีภายในไม่กี่นาทีว่าโค้ดที่แก้ไปมีปัญหาหรือไม่
- **ขยายระดับได้ (Scalability)**: เราสามารถเพิ่ม Endpoint หรือ Browser ที่ต้องการทดสอบได้โดยไม่ทำให้เวลารวมในการรอรันนานขึ้นมากนัก
- **ความน่าเชื่อถือสูง**: ทุกๆ Pull Request จะถูกตรวจสอบทั้งเรื่องสไตล์โค้ด, ความปลอดภัย, ประสิทธิภาพ และ UI โดยอัตโนมัติ

---
**สถานะ**: ใช้งานปกติ (ACTIVE) | **ผู้ให้บริการ**: GitHub Actions | **แพ็กเกจ**: FREE Tier
