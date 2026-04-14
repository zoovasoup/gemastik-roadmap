Adaptive Efficiency Engine
Technical Specification & Product Overview

1. Visi & Problem Statement
   Problem
   Platform edukasi digital mayoritas gagal di dua titik fundamental:
   Kegagalan Pertama — Kurikulum Statis: Materi yang disusun di awal tidak berubah meski user menunjukkan sinyal kegagalan nyata. User dipaksa melanjutkan jalur yang sudah tidak relevan dengan kondisi pemahamannya saat ini.
   Kegagalan Kedua — Validasi Berbasis Ujian: Model penilaian kaku mengukur performa dalam satu momen waktu, bukan akumulasi kompetensi nyata. Ini menciptakan burnout dan memberikan false signal kepada sistem maupun user itu sendiri.
   Solusi
   Adaptive Efficiency Engine adalah platform pembelajaran adaptif berbasis AI yang dirancang sebagai closed-loop system — sistem yang tidak berhenti di generasi konten, melainkan terus memantau sinyal belajar user untuk merekalibrasi jalur secara otomatis.
   Prinsip desain utama: sistem yang baik bukan yang memberikan materi terbaik, melainkan yang tahu kapan harus berhenti, menilai ulang, dan menyesuaikan rute berdasarkan sinyal kegagalan nyata.

2. Gambaran Umum Produk
   Apa yang Dilakukan Platform Ini
   User datang dengan satu tujuan belajar besar (contoh: "Saya ingin bisa deploy web app full-stack dalam 3 bulan"). Platform kemudian:
   Memecah tujuan tersebut menjadi node-node atomik yang terurut secara pedagogis.
   Menyajikan materi per node sesuai content_type yang ditentukan (video, bacaan, hands-on, diskusi).
   Memvalidasi penguasaan tiap node melalui dialog Socratic dan/atau verifikasi artefak nyata — bukan ujian formal.
   Memantau sinyal frustrasi secara kontinu dan memicu perombakan kurikulum otomatis jika threshold terlampaui.
   Memperbarui profil kognitif user setelah setiap node selesai, membangun memori jangka panjang tentang pola kekuatan dan kelemahan spesifik tiap individu.
   Diferensiasi Utama
   Auto-Recalibration: Jika skor frustasi kumulatif melampaui threshold, AI secara otomatis menarik ulang seluruh sisa roadmap — tanpa mengubah tujuan akhir, hanya menyesuaikan rute dan urutan materi.
   Invisible Validation: Tidak ada ujian formal. Kompetensi diukur melalui dialog Socratic (AI mengekstraksi competency_score 0–100) dan verifikasi artefak fungsional yang benar-benar bisa dijalankan.
   Contextual Memory: user_cognitive_profiles diperbarui secara incremental, membangun representasi permanen tentang pola belajar tiap user — sehingga setiap sesi baru dimulai dengan konteks yang sudah terakumulasi, bukan dari nol.

3. User Flow (End-to-End)

4. Arsitektur Inti: Tiga Sub-Sistem
   4A. Micro-Curriculum Synthesis (The Brain)
   Sub-sistem ini bertanggung jawab memecah tujuan belajar besar menjadi unit-unit atomik yang dapat divalidasi secara independen.
   Input:
   goal_description dari user (teks bebas)
   weak_topics dari user_cognitive_profiles (array topik yang menunjukkan pola kelemahan historis)
   Process: Backend oRPC mengirim prompt ke Gemini dengan instruksi Strict JSON Output — tidak ada teks narasi, hanya struktur data. Ini memastikan output bisa langsung diproses tanpa parsing kompleks.
   Output: Array of roadmap_nodes, masing-masing berisi:
   id: UUID node
   title: Judul topik atomik
   difficulty_level: Skala 1–10
   estimated_time: Estimasi durasi dalam menit
   content_type: Enum — video / reading / hands-on / socratic
   success_criteria: Deskripsi eksplisit definisi "lulus" untuk node ini
   is_completed: Boolean, default false
   Constraint Kritis: AI dilarang menghasilkan node redundan. Setiap node harus memiliki tujuan kompetensi yang unik dan dapat diverifikasi secara objektif.
   Untuk menjamin Micro-Curriculum Synthesis tidak menghasilkan output sampah, setiap interaksi Gemini wajib mengikuti Zod Output Schema berikut. AI dilarang memberikan narasi di luar blok JSON ini. success_criteria tidak boleh berupa kalimat pasif, melainkan array of measurable indicators.
   Field
   Zod Type
   Constraint
   nodes
   z.array(nodeSchema)
   Minimal 3 node, maksimal 7 per batch.
   nodes.title
   z.string().max(50)
   Harus action-oriented (e.g., "Implementasi JWT").
   nodes.difficulty_level
   z.number().min(1).max(10)
   Harus berbasis learning_velocity user.
   nodes.content_type
   z.enum(["video", "reading", "hands-on", "socratic"])
   Sesuai ketersediaan resource.
   nodes.success_criteria
   z.array(z.string())
   Harus biner (Dapat diverifikasi/Tidak).

System Instruction Snippet: "You are the Engine. Act as a senior pedagogical architect. Output ONLY raw JSON. Ensure each success_criteria is a verifiable atomic task for the Invisible Validation Loop."

4B. Invisible Validation Loop
Sub-sistem ini menggantikan model ujian kaku dengan dua mekanisme validasi berbasis aktivitas nyata.
Socratic Feedback Loop
Method: AI melakukan asesmen melalui dialog santai atau metode teaching-back — user diminta menjelaskan konsep balik ke AI dengan kata-kata sendiri.
Storage: Riwayat percakapan disimpan dalam tabel socratic_sessions sebagai JSONB untuk fleksibilitas struktur data lintas topik.
Logic: Gemini mengekstraksi competency_score (0–100) dari keseluruhan dialog — bukan hanya jawaban terakhir. Jika score ≥ 80, node di-set is_completed = true.
Micro-Artifacts Verification
Method: User mengunggah bukti kerja fungsional — link repo GitHub, URL live demo, atau file yang dapat dieksekusi.
Validation: Gemini bertindak sebagai reviewer, mengevaluasi artefak berdasarkan success_criteria yang sudah didefinisikan saat node di-generate.
Streak Mechanic: Streak hanya bertambah jika artefak terverifikasi. Ini memastikan streak merepresentasikan akumulasi kompetensi nyata, bukan sekadar durasi pemakaian aplikasi.

4C. Auto-Recalibration Logic (The Unfair Advantage)
Mekanisme yang paling membedakan platform ini. Sistem mendeteksi kegagalan belajar dan memicu perombakan kurikulum secara otomatis.
Trigger: Rumus skor frustrasi kumulatif yang dihitung di level service layer backend:
F_total = Σ(stumble_count × 1.5) + (1 − sentiment_score)
stumble_count: Jumlah kegagalan validasi atau pengulangan materi pada node aktif
sentiment_score: Nilai 0–1 yang diekstraksi Gemini dari nada dan konten dialog Socratic
Action (jika F_total > Threshold):
Tarik semua roadmap_nodes yang belum selesai (is_completed = false)
Gabungkan dengan data kesulitan terbaru dari user_cognitive_profiles
Kirim ke Gemini untuk re-generation urutan dan konten materi
Tujuan akhir (goal_description) tidak berubah — hanya rute yang disesuaikan
Penting: Logika ini berjalan di level service layer backend (oRPC), bukan di frontend. Ini memastikan mekanisme ini tidak bisa di-bypass oleh klien.

5. Model Data
   users
   Entitas dasar autentikasi. Terhubung ke user_cognitive_profiles dengan relasi 1-to-1.
   user_cognitive_profiles
   Entitas sentral yang menjadi "memori jangka panjang" sistem. Diperbarui setelah setiap node selesai.
   Field
   Type
   Deskripsi
   user_id
   UUID
   FK ke users
   weak_topics
   JSONB array
   Topik dengan pola kegagalan berulang
   strength_topics
   JSONB array
   Topik yang dikuasai secara konsisten
   learning_velocity
   JSONB
   Kecepatan rata-rata penyelesaian per kategori
   frustration_baseline
   float
   Threshold dinamis per user
   updated_at
   timestamp
   Timestamp pembaruan terakhir

roadmap_nodes
Unit atomik pembelajaran. Setiap node bersifat independen.
Field
Type
Deskripsi
id
UUID
Primary key
user_id
UUID
FK ke users
goal_id
UUID
FK ke tujuan belajar aktif
title
text
Judul topik
difficulty_level
int
Skala 1–10
estimated_time
int
Estimasi menit
content_type
enum
video / reading / hands-on / socratic
success_criteria
text
Definisi eksplisit "lulus"
is_completed
boolean
Default false
order_index
int
Urutan dalam roadmap
created_at
timestamp

socratic_sessions
Menyimpan seluruh riwayat dialog antara user dan AI.
Field
Type
Deskripsi
id
UUID
Primary key
node_id
UUID
FK ke roadmap_nodes
user_id
UUID
FK ke users
conversation
JSONB
Array of {role, content, timestamp}
competency_score
int
Skor 0–100 yang diekstraksi Gemini
stumble_count
int
Jumlah kegagalan dalam sesi ini
sentiment_score
float
Nilai 0–1 dari analisis Gemini
created_at
timestamp

artifacts
Bukti kerja fungsional yang diunggah user.
Field
Type
Deskripsi
id
UUID
Primary key
node_id
UUID
FK ke roadmap_nodes
user_id
UUID
FK ke users
submission_url
text
URL repo / demo
review_result
JSONB
Output review Gemini
is_verified
boolean
Hasil akhir verifikasi
submitted_at
timestamp

6. Spesifikasi Teknis & Stack
   Komponen
   Teknologi
   Peran Strategis
   Backend
   Node.js & oRPC
   End-to-end type safety, auto-dokumentasi API. oRPC menjamin contract antara frontend dan backend tidak bisa desync.
   Database
   PostgreSQL & Drizzle ORM
   Mengelola relasi kompleks antara profil kognitif, roadmap_nodes, dan riwayat progres. Schema migrations terverifikasi.
   AI Model
   Gemini (Free Tier)
   Engine utama untuk Roadmap Generation, Socratic Logic, dan Artifact Review.
   Security
   Supabase RLS + oRPC Middleware
   Defense in Depth: filter di level API (middleware) dan level database (Row Level Security).
   Type Safety
   better-t-stack
   Shared types antara frontend dan backend. Meminimalisir runtime errors dan mempercepat debugging.

Untuk menjaga Strict Type Safety dan Defense in Depth , seluruh prosedur di packages/api wajib menggunakan protectedProcedure yang menginjeksi userId secara otomatis. Ini mencegah mismatch antara data yang diminta frontend dan apa yang diproses backend.
Procedure Name
Input Schema (Zod)
Primary Business Logic
learning.generate
{ goal: z.string().min(10) }
Ambil weak*topics , tembak Gemini, batch insert ke roadmap_nodes.
validation.chat
{ nodeId: z.string().uuid(), message: z.string() }
Append ke socratic_sessions.conversation , hitung sentiment_score.
validation.finalize
{ nodeId: z.string().uuid() }
Minta Gemini ekstraksi competency_score , jika $\ge 80$ set is_completed.
infra.recalibrate
{ roadmapId: z.string().uuid() }
Cek $F*{total}$ , tarik unfinished nodes , trigger re-generation.

7. Security Model
   Platform mengimplementasikan Defense in Depth melalui dua layer independen:
   Layer 1 — oRPC Middleware: Setiap request divalidasi di level API sebelum menyentuh business logic. Autentikasi dan autorisasi di-handle di sini.
   Layer 2 — Supabase Row Level Security (RLS): Kebijakan di level database memastikan query apapun — bahkan yang lolos dari middleware — hanya bisa mengakses data milik user yang sedang terautentikasi. User A tidak bisa membaca roadmap_nodes milik User B, bahkan secara teknis.

8. Constraint & Strategi Optimasi (Gemini Free Tier)
   Karena menggunakan Gemini pada free tier, ada limitasi token dan rate limit yang harus diatasi secara arsitektural.
   Data Thinning (Context Compression)
   oRPC service hanya mengirimkan 5–10 log aktivitas terakhir sebagai konteks recalibration, bukan seluruh riwayat database. Ini bukan kompromi — ini desain yang disengaja: kondisi kognitif user terkini jauh lebih relevan dari riwayat 3 bulan lalu.
   State Persistence (Progressive Profiling)
   user*cognitive_profiles diperbarui secara incremental setelah setiap node selesai. AI tidak perlu kalkulasi ulang dari nol — ia membaca snapshot profil terkini dan mengekstensinya.
   Centralized Error Handling
   Global error middleware di level oRPC menangani kegagalan AI API tanpa menghentikan fungsionalitas utama aplikasi. Jika Gemini timeout, sistem jatuh ke mode manual (user tetap bisa belajar, recalibration dijadwalkan ulang) — bukan crash total.
   Untuk memastikan Contextual Memory bekerja incremental, urutan pembaruan state saat recalibration atau validation harus bersifat atomik (Database Transaction).
   Trigger $F*{total}$: Saat user mengirim pesan atau gagal verifikasi, service layer menghitung $F_{total}$ menggunakan data stumble_count dan sentiment_score terkini.
   Profile Sync: Sebelum rekalsibari dimulai, sistem wajib memperbarui user_cognitive_profiles.weak_topics berdasarkan kegagalan terakhir agar AI punya konteks kegagalan terbaru.
   Re-generation Workflow: Sistem menarik sisa roadmap_nodes yang belum selesai , mengirimnya ke Gemini bersama profil terbaru , dan menghapus node lama yang belum selesai untuk digantikan dengan urutan materi yang baru.
   AI Fallback: Jika Gemini mencapai rate limit atau memberikan JSON invalid , sistem akan menunda rekalibrasi (Job Queue) dan memberitahukan user untuk melanjutkan materi yang ada dengan fallback content berbasis teks statis.

9. Risiko & Open Questions
   Risiko Teknis
   Akurasi competency_score dari Socratic dialog: AI rentan terhadap language fluency bias — user yang verbal expressive akan tampak lebih menguasai materi dari user yang introvert, padahal penguasaan konsepnya bisa sama. Mitigasi: kalibrasi prompt dengan contoh scoring eksplisit dan lakukan human audit pada sample sesi.
   Threshold frustasi global: Nilai threshold yang bersifat konstanta global berisiko menciptakan instabilitas kurikulum pada user dengan learning style yang naturally iteratif (sering trial-error). Perlu mekanisme personalisasi threshold per user berbasis riwayat frustrasi individual.
   Rate limit saat recalibration burst: Jika banyak user mencapai threshold frustrasi secara bersamaan, queue request ke Gemini perlu dikelola. Solusi: implement request queuing dengan exponential backoff di service layer.
   Open Design Decisions
   Siapa yang mendefinisikan success_criteria tiap node — AI-generated, user-defined, atau berbasis template kurator? Ini berpengaruh langsung pada konsistensi kualitas validasi.
   Apakah streak yang di-reset saat artefak gagal cukup sebagai negative reinforcement, atau perlu mekanisme tambahan?
   Kapan platform memutuskan untuk tidak hanya merekalibrasi rute, melainkan menyarankan user untuk meninjau ulang tujuan akhirnya?
   Bagaimana sistem menangani tujuan belajar yang terlalu open-ended dan sulit didefinisikan success criteria-nya secara objektif?

Dokumen ini adalah living document. Semua keputusan arsitektur bersifat revisable hingga development sprint dimulai.
