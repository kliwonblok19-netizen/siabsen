export const ERD_DOCUMENTATION = `
# ERD (Entity Relationship Diagram) & Relasi Database

Aplikasi Sistem Informasi Absensi SMK dirancang dengan integritas data tinggi dan normalisasi database (3NF):

1. **departments (Jurusan)**:
   - id (PK), code (UNIQUE: DKV, DPIB, TKP, TOI, TITL, TAV, TSM, TKR), name, description.
   - Relasi: 1 Jurusan -> many Rombel (1:N).

2. **academic_years (Tahun Ajaran)**:
   - id (PK), name ('2025/2026'), semester ('Ganjil'|'Genap'), is_active (BOOLEAN), start_date, end_date.
   - Relasi: 1 Tahun Ajaran -> many Rombel, Schedules, Sessions (1:N).

3. **teachers (Guru)**:
   - id (PK), nip (UNIQUE), name, email (UNIQUE), phone, gender, specialization, status.
   - Relasi: 1 Guru -> 1 User Account (1:1 opsional), 1 Guru -> many Teaching Assignments (1:N), 1 Guru -> 1..N Wali Kelas (1:N per periode).

4. **users (Pengguna & Hak Akses)**:
   - id (PK), username (UNIQUE), email (UNIQUE), password_hash, role ('admin'|'wali_kelas'|'guru'|'sekretaris'), teacher_id (FK nullable), student_id (FK nullable -> students.id), secretary_rombel_id (FK nullable -> rombels.id).

5. **classes / rombels (Rombel Kelas)**:
   - id (PK), code (UNIQUE, cth: 'DKV-XI-1'), name ('XI DKV 1'), grade ('X'|'XI'|'XII'), department_id (FK), academic_year_id (FK), homeroom_teacher_id (FK).
   - Relasi: 1 Rombel -> many Students (1:N), 1 Rombel -> many Attendance Sessions (1:N).

6. **students (Siswa)**:
   - id (PK), nis (UNIQUE), nisn (nullable), name, gender ('L'|'P'), department_id (FK), rombel_id (FK), academic_year_id (FK), status ('active'|'moved'|'graduated'|'inactive').
   - Catatan Desain: Perpindahan rombel didukung dengan mempertahankan riwayat id siswa pada tabel attendance_records.

7. **subjects (Mata Pelajaran)**:
   - id (PK), code (UNIQUE), name, category, credit_hours.

8. **teaching_assignments (Penugasan Mengajar Guru)**:
   - id (PK), academic_year_id (FK), teacher_id (FK), subject_id (FK), rombel_id (FK).
   - CONSTRAINT UNIQUE (academic_year_id, teacher_id, subject_id, rombel_id).
   - Mendukung satu guru mengajar banyak mapel di banyak rombel!

9. **schedules (Jadwal Pelajaran)**:
   - id (PK), academic_year_id (FK), day_of_week (1..6), period_start, period_end, time_start, time_end, teacher_id (FK), subject_id (FK), rombel_id (FK), room.

10. **attendance_sessions (Sesi Presensi Per Pertemuan)**:
    - id (PK), academic_year_id (FK), rombel_id (FK), subject_id (FK), teacher_id (FK), schedule_id (FK nullable), date (DATE), period (VARCHAR), meeting_number (INT), topic (TEXT), status ('completed'|'draft'|'cancelled'|'locked'), locked_at, locked_by.
    - CONSTRAINT UNIQUE (academic_year_id, rombel_id, subject_id, date, meeting_number) -> MENCEGAH SESI GANDA!

11. **attendance_records (Presensi Siswa)**:
    - id (PK), session_id (FK -> attendance_sessions.id ON DELETE CASCADE), student_id (FK -> students.id), status (ENUM: 'H','S','I','A','T','D'), note (VARCHAR/TEXT), updated_by (FK users), updated_at.
    - CONSTRAINT UNIQUE (session_id, student_id) -> MENCEGAH 1 SISWA TERCATAT GANDA PADA SATU SESI!

12. **audit_logs (Riwayat Perubahan & Audit Trail)**:
    - id (PK), timestamp, user_id (FK), user_name, user_role, action, entity, entity_id, description, before_value (JSON/TEXT), after_value (JSON/TEXT), reason.

13. **class_secretary_assignments (Penugasan Sekretaris Kelas)**:
    - id (PK), user_id (FK users), student_id (FK students), rombel_id (FK rombels), academic_year_id (FK academic_years), is_active (BOOLEAN), assigned_at, deassigned_at (NULL), assigned_by_user_id (FK users), notes.
    - CONSTRAINT: 1 rombel default memiliki 1 sekretaris aktif per periode tahun ajaran.

14. **attendance_correction_requests (Pengajuan Koreksi Absensi oleh Sekretaris)**:
    - id (PK), secretary_user_id (FK), student_id (FK), rombel_id (FK), subject_id (FK), session_id (FK nullable), attendance_date (DATE), current_status (ENUM), proposed_status (ENUM), reason (TEXT), supporting_evidence, status ('PENDING'|'APPROVED'|'REJECTED'|'NEED_INFO'), reviewed_by_user_id (FK), reviewed_at, review_notes.
    - Catatan Alur: Pengajuan tidak langsung mengubah status absensi sebelum disetujui Wali Kelas / Guru Pengampu.
`;

export const MYSQL_DDL_SCHEMA = `-- ========================================================
-- SISTEM INFORMASI ABSENSI SISWA SMK
-- MySQL / MariaDB Schema DDL with Foreign Keys & Constraints
-- Timezone: Asia/Jakarta | Engine: InnoDB | Charset: utf8mb4
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`smk_absensi\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`smk_absensi\`;

-- 1. Tabel Users
CREATE TABLE \`users\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'wali_kelas', 'guru', 'sekretaris') NOT NULL DEFAULT 'guru',
  \`teacher_id\` BIGINT UNSIGNED NULL,
  \`student_id\` BIGINT UNSIGNED NULL,
  \`secretary_rombel_id\` BIGINT UNSIGNED NULL,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_users_role\` (\`role\`)
) ENGINE=InnoDB;

-- 2. Tabel Teachers
CREATE TABLE \`teachers\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`nip\` VARCHAR(30) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`phone\` VARCHAR(20) NULL,
  \`gender\` ENUM('L', 'P') NOT NULL,
  \`specialization\` VARCHAR(100) NULL,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabel Departments (Jurusan)
CREATE TABLE \`departments\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabel Academic Years
CREATE TABLE \`academic_years\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(20) NOT NULL,
  \`semester\` ENUM('Ganjil', 'Genap') NOT NULL,
  \`is_active\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`start_date\` DATE NOT NULL,
  \`end_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabel Classes / Rombel
CREATE TABLE \`rombels\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(30) NOT NULL UNIQUE,
  \`name\` VARCHAR(50) NOT NULL,
  \`grade\` ENUM('X', 'XI', 'XII') NOT NULL,
  \`department_id\` BIGINT UNSIGNED NOT NULL,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`homeroom_teacher_id\` BIGINT UNSIGNED NOT NULL,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON UPDATE CASCADE,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`) ON UPDATE CASCADE,
  FOREIGN KEY (\`homeroom_teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Tabel Students
CREATE TABLE \`students\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`nis\` VARCHAR(20) NOT NULL UNIQUE,
  \`nisn\` VARCHAR(20) NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`gender\` ENUM('L', 'P') NOT NULL,
  \`department_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`status\` ENUM('active', 'moved', 'graduated', 'inactive') NOT NULL DEFAULT 'active',
  \`phone\` VARCHAR(20) NULL,
  \`parent_name\` VARCHAR(100) NULL,
  \`parent_phone\` VARCHAR(20) NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON UPDATE CASCADE,
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`) ON UPDATE CASCADE,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`) ON UPDATE CASCADE,
  INDEX \`idx_student_rombel\` (\`rombel_id\`, \`status\`)
) ENGINE=InnoDB;

-- 7. Tabel Subjects
CREATE TABLE \`subjects\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`credit_hours\` INT NOT NULL DEFAULT 2,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Penugasan Mengajar Guru (Teaching Assignments)
CREATE TABLE \`teaching_assignments\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`teacher_id\` BIGINT UNSIGNED NOT NULL,
  \`subject_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`unique_teacher_class_subject\` (\`academic_year_id\`, \`teacher_id\`, \`subject_id\`, \`rombel_id\`)
) ENGINE=InnoDB;

-- 9. Jadwal Pelajaran
CREATE TABLE \`schedules\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`day_of_week\` TINYINT NOT NULL COMMENT '1:Senin .. 6:Sabtu',
  \`period_start\` INT NOT NULL,
  \`period_end\` INT NOT NULL,
  \`time_start\` TIME NOT NULL,
  \`time_end\` TIME NOT NULL,
  \`teacher_id\` BIGINT UNSIGNED NOT NULL,
  \`subject_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`room\` VARCHAR(50) NULL,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Sesi Presensi Per Pertemuan
CREATE TABLE \`attendance_sessions\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`subject_id\` BIGINT UNSIGNED NOT NULL,
  \`teacher_id\` BIGINT UNSIGNED NOT NULL,
  \`schedule_id\` BIGINT UNSIGNED NULL,
  \`date\` DATE NOT NULL,
  \`period\` VARCHAR(50) NOT NULL,
  \`meeting_number\` INT NOT NULL,
  \`topic\` TEXT NULL,
  \`status\` ENUM('draft', 'completed', 'cancelled', 'locked') NOT NULL DEFAULT 'completed',
  \`locked_at\` DATETIME NULL,
  \`locked_by\` VARCHAR(50) NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`),
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`),
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`),
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`),
  FOREIGN KEY (\`schedule_id\`) REFERENCES \`schedules\`(\`id\`) ON DELETE SET NULL,
  -- CONSTRAINT: Mencegah duplikasi pencatatan sesi untuk kelas, mapel, tanggal, dan pertemuan yang sama
  UNIQUE KEY \`unique_attendance_session\` (\`academic_year_id\`, \`rombel_id\`, \`subject_id\`, \`date\`, \`meeting_number\`)
) ENGINE=InnoDB;

-- 11. Detail Presensi Setiap Siswa (Attendance Records)
CREATE TABLE \`attendance_records\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`session_id\` BIGINT UNSIGNED NOT NULL,
  \`student_id\` BIGINT UNSIGNED NOT NULL,
  \`status\` ENUM('H', 'S', 'I', 'A', 'T', 'D') NOT NULL DEFAULT 'H' COMMENT 'H:Hadir, S:Sakit, I:Izin, A:Alpa, T:Terlambat, D:Dispensasi',
  \`note\` VARCHAR(255) NULL,
  \`updated_by\` BIGINT UNSIGNED NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`session_id\`) REFERENCES \`attendance_sessions\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
  -- CONSTRAINT: 1 Siswa hanya boleh memiliki 1 rekaman presensi dalam 1 sesi pembelajaran
  UNIQUE KEY \`unique_session_student\` (\`session_id\`, \`student_id\`)
) ENGINE=InnoDB;

-- 12. Tabel Audit Log
CREATE TABLE \`audit_logs\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`user_name\` VARCHAR(100) NOT NULL,
  \`user_role\` VARCHAR(30) NOT NULL,
  \`action\` VARCHAR(30) NOT NULL,
  \`entity\` VARCHAR(50) NOT NULL,
  \`entity_id\` VARCHAR(50) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`before_value\` LONGTEXT NULL,
  \`after_value\` LONGTEXT NULL,
  \`reason\` TEXT NULL,
  INDEX \`idx_audit_entity\` (\`entity\`, \`entity_id\`)
) ENGINE=InnoDB;

-- 13. Tabel Penugasan Sekretaris Kelas (Class Secretary Assignments)
CREATE TABLE \`class_secretary_assignments\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` BIGINT UNSIGNED NOT NULL,
  \`student_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`academic_year_id\` BIGINT UNSIGNED NOT NULL,
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`assigned_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`deassigned_at\` TIMESTAMP NULL,
  \`assigned_by_user_id\` BIGINT UNSIGNED NOT NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\`(\`id\`) ON DELETE CASCADE,
  INDEX \`idx_sec_active_rombel\` (\`rombel_id\`, \`academic_year_id\`, \`is_active\`)
) ENGINE=InnoDB;

-- 14. Tabel Pengajuan Koreksi Absensi (Attendance Correction Requests)
CREATE TABLE \`attendance_correction_requests\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`secretary_user_id\` BIGINT UNSIGNED NOT NULL,
  \`secretary_student_id\` BIGINT UNSIGNED NOT NULL,
  \`rombel_id\` BIGINT UNSIGNED NOT NULL,
  \`student_id\` BIGINT UNSIGNED NOT NULL,
  \`session_id\` BIGINT UNSIGNED NULL,
  \`attendance_date\` DATE NOT NULL,
  \`subject_id\` BIGINT UNSIGNED NOT NULL,
  \`current_status\` ENUM('H', 'S', 'I', 'A', 'T', 'D', '-') NOT NULL,
  \`proposed_status\` ENUM('H', 'S', 'I', 'A', 'T', 'D') NOT NULL,
  \`reason\` TEXT NOT NULL,
  \`supporting_evidence\` VARCHAR(255) NULL,
  \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEED_INFO') NOT NULL DEFAULT 'PENDING',
  \`reviewed_by_user_id\` BIGINT UNSIGNED NULL,
  \`reviewed_at\` TIMESTAMP NULL,
  \`review_notes\` TEXT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`secretary_user_id\`) REFERENCES \`users\`(\`id\`),
  FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`rombel_id\`) REFERENCES \`rombels\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`session_id\`) REFERENCES \`attendance_sessions\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`reviewed_by_user_id\`) REFERENCES \`users\`(\`id\`),
  INDEX \`idx_corr_rombel_status\` (\`rombel_id\`, \`status\`)
) ENGINE=InnoDB;
`;

export const LARAVEL_MIGRATION_SAMPLE = `<?php
// database/migrations/2026_01_01_000010_create_attendance_sessions_and_records_table.php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->foreignId('rombel_id')->constrained('rombels');
            $table->foreignId('subject_id')->constrained('subjects');
            $table->foreignId('teacher_id')->constrained('teachers');
            $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->date('date');
            $table->string('period', 50);
            $table->unsignedInteger('meeting_number');
            $table->text('topic')->nullable();
            $table->enum('status', ['draft', 'completed', 'cancelled', 'locked'])->default('completed');
            $table->timestamp('locked_at')->nullable();
            $table->string('locked_by', 50)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Cegah duplikasi sesi untuk rombel, mapel, tanggal, dan pertemuan yang sama
            $table->unique(
                ['academic_year_id', 'rombel_id', 'subject_id', 'date', 'meeting_number'],
                'uq_session_rombel_subj_date_meeting'
            );
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('status', ['H', 'S', 'I', 'A', 'T', 'D'])->default('H');
            $table->string('note')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Cegah duplikasi absensi siswa dalam 1 sesi
            $table->unique(['session_id', 'student_id'], 'uq_session_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');
    }
};
`;

export const LARAVEL_CONTROLLER_SAMPLE = `<?php
// app/Http/Controllers/AttendanceController.php

namespace App\\Http\\Controllers;

use App\\Models\\AttendanceSession;
use App\\Models\\AttendanceRecord;
use App\\Models\\AuditLog;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Auth;

class AttendanceController extends Controller
{
    /**
     * Menyimpan sesi absensi per pertemuan mata pelajaran
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'rombel_id' => 'required|exists:rombels,id',
            'subject_id' => 'required|exists:subjects,id',
            'date' => 'required|date',
            'period' => 'required|string',
            'meeting_number' => 'required|integer|min:1',
            'topic' => 'nullable|string',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:H,S,I,A,T,D',
            'records.*.note' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Otorisasi: Pastikan guru mengajar mata pelajaran di rombel ini
        if ($user->role === 'guru') {
            $isAssigned = DB::table('teaching_assignments')
                ->where('academic_year_id', $validated['academic_year_id'])
                ->where('teacher_id', $user->teacher_id)
                ->where('subject_id', $validated['subject_id'])
                ->where('rombel_id', $validated['rombel_id'])
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'Anda tidak memiliki wewenang mencatat presensi untuk mata pelajaran dan kelas ini.'
                ], 403);
            }
        }

        return DB::transaction(function () use ($validated, $user) {
            // 1. Buat Sesi
            $session = AttendanceSession::create([
                'academic_year_id' => $validated['academic_year_id'],
                'rombel_id' => $validated['rombel_id'],
                'subject_id' => $validated['subject_id'],
                'teacher_id' => $user->teacher_id ?? 1,
                'date' => $validated['date'],
                'period' => $validated['period'],
                'meeting_number' => $validated['meeting_number'],
                'topic' => $validated['topic'],
                'status' => 'completed',
            ]);

            // 2. Simpan Catatan Siswa
            foreach ($validated['records'] as $item) {
                AttendanceRecord::create([
                    'session_id' => $session->id,
                    'student_id' => $item['student_id'],
                    'status' => $item['status'],
                    'note' => $item['note'] ?? null,
                    'updated_by' => $user->id,
                ]);
            }

            // 3. Catat ke Audit Log
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'action' => 'CREATE',
                'entity' => 'AttendanceSession',
                'entity_id' => $session->id,
                'description' => "Mencatat absensi pertemuan ke-{$session->meeting_number}",
            ]);

            return response()->json([
                'message' => 'Presensi berhasil disimpan.',
                'session' => $session->load('records')
            ], 201);
        });
    }
}
`;

export const LARAVEL_SECRETARY_CORRECTION_SAMPLE = `<?php
// app/Http/Controllers/AttendanceCorrectionController.php
// Implementasi Role Sekretaris Kelas & Alur Pengajuan Koreksi Absensi

namespace App\\Http\\Controllers;

use App\\Models\\AttendanceCorrectionRequest;
use App\\Models\\AttendanceRecord;
use App\\Models\\ClassSecretaryAssignment;
use App\\Models\\AuditLog;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;
use Illuminate\\Support\\Facades\\DB;

class AttendanceCorrectionController extends Controller
{
    /**
     * 1. Pengajuan Koreksi Absensi oleh Sekretaris Kelas
     * Prinsip Keamanan:
     * - Hanya Sekretaris Kelas yang berwenang
     * - Hanya untuk rombel tempat sekretaris aktif ditugaskan
     * - Status awal: PENDING (TIDAK LANGSUNG MENGUBAH CATATAN RESMI)
     */
    public function submit(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'sekretaris') {
            return response()->json(['message' => 'Hanya akun Sekretaris Kelas yang berwenang mengajukan koreksi.'], 403);
        }

        $activeAssignment = ClassSecretaryAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$activeAssignment) {
            return response()->json(['message' => 'Akun Anda tidak memiliki penugasan sekretaris aktif.'], 403);
        }

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'rombel_id' => 'required|in:' . $activeAssignment->rombel_id, // ISOLASI ROMBEL KETAT
            'subject_id' => 'required|exists:subjects,id',
            'attendance_date' => 'required|date',
            'session_id' => 'nullable|exists:attendance_sessions,id',
            'current_status' => 'required|in:H,S,I,A,T,D,-',
            'proposed_status' => 'required|in:H,S,I,A,T,D',
            'reason' => 'required|string|min:5|max:500',
            'supporting_evidence' => 'nullable|string|max:255'
        ]);

        $correction = AttendanceCorrectionRequest::create([
            'secretary_user_id' => $user->id,
            'secretary_student_id' => $user->student_id,
            'rombel_id' => $activeAssignment->rombel_id,
            'student_id' => $validated['student_id'],
            'session_id' => $validated['session_id'] ?? null,
            'attendance_date' => $validated['attendance_date'],
            'subject_id' => $validated['subject_id'],
            'current_status' => $validated['current_status'],
            'proposed_status' => $validated['proposed_status'],
            'reason' => $validated['reason'],
            'supporting_evidence' => $validated['supporting_evidence'] ?? null,
            'status' => 'PENDING'
        ]);

        // Audit Log pengajuan
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => 'sekretaris',
            'action' => 'CREATE',
            'entity' => 'AttendanceCorrectionRequest',
            'entity_id' => $correction->id,
            'description' => "Pengajuan koreksi presensi siswa #{$correction->student_id} dari status {$correction->current_status} menjadi {$correction->proposed_status}",
            'reason' => $correction->reason
        ]);

        return response()->json([
            'message' => 'Pengajuan koreksi berhasil dikirim dan menunggu verifikasi Wali Kelas / Guru.',
            'data' => $correction
        ], 201);
    }

    /**
     * 2. Verifikasi & Keputusan oleh Wali Kelas atau Guru Pengampu
     * Jika disetujui (APPROVED), barulah catatan resmi absensi di-update dan diaudit.
     */
    public function review(Request $request, $id)
    {
        $user = Auth::user();
        $correction = AttendanceCorrectionRequest::findOrFail($id);

        // Otorisasi: Wali kelas rombel tersebut ATAU guru pengampu mapel bersangkutan ATAU admin
        $isAuthorized = false;
        if ($user->role === 'admin') {
            $isAuthorized = true;
        } elseif ($user->role === 'wali_kelas') {
            $isHomeroom = DB::table('rombels')
                ->where('id', $correction->rombel_id)
                ->where('homeroom_teacher_id', $user->teacher_id)
                ->exists();
            $isAuthorized = $isHomeroom;
        } elseif ($user->role === 'guru') {
            $isTeacher = DB::table('teaching_assignments')
                ->where('teacher_id', $user->teacher_id)
                ->where('rombel_id', $correction->rombel_id)
                ->where('subject_id', $correction->subject_id)
                ->exists();
            $isAuthorized = $isTeacher;
        }

        if (!$isAuthorized) {
            return response()->json(['message' => 'Anda tidak memiliki hak otorisasi untuk memproses pengajuan ini.'], 403);
        }

        $validated = $request->validate([
            'action' => 'required|in:APPROVED,REJECTED,NEED_INFO',
            'review_notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($correction, $validated, $user) {
            $oldStatus = $correction->status;
            $correction->status = $validated['action'];
            $correction->reviewed_by_user_id = $user->id;
            $correction->reviewed_at = now();
            $correction->review_notes = $validated['review_notes'] ?? null;
            $correction->save();

            // JIKA DISETUJUI: Update catatan resmi attendance_records
            if ($validated['action'] === 'APPROVED') {
                if ($correction->session_id) {
                    $record = AttendanceRecord::where('session_id', $correction->session_id)
                        ->where('student_id', $correction->student_id)
                        ->first();

                    if ($record) {
                        $beforeVal = $record->status;
                        $record->status = $correction->proposed_status;
                        $record->updated_by = $user->id;
                        $record->save();

                        // Catat Audit Trail resmi
                        AuditLog::create([
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'user_role' => $user->role,
                            'action' => 'CORRECTION',
                            'entity' => 'AttendanceRecord',
                            'entity_id' => $record->id,
                            'description' => "Koreksi absensi disetujui atas pengajuan sekretaris",
                            'before_value' => $beforeVal,
                            'after_value' => $correction->proposed_status,
                            'reason' => "Pengajuan Sekretaris Disetujui: " . ($validated['review_notes'] ?? $correction->reason)
                        ]);
                    }
                }
            }

            return response()->json([
                'message' => "Pengajuan koreksi berhasil diperbarui menjadi {$validated['action']}.",
                'data' => $correction
            ]);
        });
    }
}
`;

