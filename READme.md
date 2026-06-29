````md
# LMS Smart

LMS Smart adalah aplikasi Learning Management System seperti Google Classroom dengan fitur AI grading otomatis.

## Tech Stack

- Backend utama: NestJS
- Database, Auth, Storage: Supabase
- Website: Next.js
- Mobile: Flutter
- AI Grading Service: Python FastAPI
- AI Model: OpenAI API

## Fitur

- Register, Login, Logout
- Ganti nama, email, dan password
- Semua user dapat membuat kelas
- Semua user dapat join kelas menggunakan kode kelas
- Owner dapat membagikan kode kelas
- Owner dapat membuat dan menghapus task
- Member dapat submit jawaban PDF/DOCX
- Sistem otomatis membaca dan menilai jawaban
- Member dapat melihat dan download hasil penilaian PDF
- Owner dapat melihat semua submission
- Owner dapat review dan mengubah nilai
- Sistem menampilkan rata-rata nilai setiap task
- Owner dapat menghapus kelas

## Struktur Project

```txt
lms-smart/
├── nest-backend/
├── ai-grader-service/
├── lms-smart-web/
├── lms_smart_mobile/
├── README.md
└── .gitignore
````

## Environment Variables

### nest-backend

```env
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_GRADER_URL=
```

### ai-grader-service

```env
OPENAI_API_KEY=
```

### lms-smart-web

```env
NEXT_PUBLIC_API_URL=
```

## Menjalankan Local

### 1. AI Grader Service

```bash
cd ai-grader-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8088
```

### 2. NestJS Backend

```bash
cd nest-backend
npm install
npm run start:dev
```

### 3. Next.js Website

```bash
cd lms-smart-web
npm install
npm run dev -- -p 3001
```

### 4. Flutter Mobile

```bash
cd lms_smart_mobile
flutter pub get
flutter run
```

## Deployment

Rekomendasi deployment:

* Supabase: Database, Auth, Storage
* Render: AI Grader FastAPI
* Railway: NestJS Backend
* Vercel: Next.js Website
* Flutter: build APK release

## Urutan Deploy

1. Setup Supabase
2. Deploy AI Grader Service
3. Deploy NestJS Backend
4. Deploy Next.js Website
5. Build Flutter APK

```
```
