-- DDL SETARA dengan migration Backend 2 (tulis tangan, mengikuti SQL yang dihasilkan Laravel untuk
-- PostgreSQL: id() = bigserial PK, foreignId = bigint, enum = varchar(255)+CHECK, timestampTz = timestamptz).
-- TUJUAN: membuktikan LOGIKA constraint pada PostgreSQL nyata. Ini BUKAN menjalankan migration Laravel.
\set ON_ERROR_STOP on
CREATE TABLE pengguna (
  id_pengguna bigserial PRIMARY KEY, nisn varchar(20) UNIQUE, nip varchar(25) UNIQUE, username varchar(50) UNIQUE,
  password varchar(255) NOT NULL, peran varchar(255) NOT NULL CHECK (peran IN ('siswa','guru','admin')),
  remember_token varchar(100), created_at timestamp(0), updated_at timestamp(0));
CREATE TABLE kelas (
  id_kelas bigserial PRIMARY KEY, nama_kelas varchar(100) NOT NULL UNIQUE,
  id_wali bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT, created_at timestamp(0), updated_at timestamp(0));
CREATE TABLE mata_pelajaran (
  id_mapel bigserial PRIMARY KEY, nama_mapel varchar(100) NOT NULL,
  id_guru bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT, created_at timestamp(0), updated_at timestamp(0),
  UNIQUE (nama_mapel, id_guru));
CREATE TABLE siswa_kelas (
  id_siswa bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  id_kelas bigint NOT NULL REFERENCES kelas(id_kelas) ON DELETE CASCADE,
  created_at timestamp(0), updated_at timestamp(0), PRIMARY KEY (id_siswa, id_kelas));
CREATE TABLE jadwal (
  id_jadwal bigserial PRIMARY KEY,
  id_mapel bigint NOT NULL REFERENCES mata_pelajaran(id_mapel) ON DELETE RESTRICT,
  id_kelas bigint NOT NULL REFERENCES kelas(id_kelas) ON DELETE RESTRICT,
  id_guru bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  waktu_mulai timestamptz NOT NULL, waktu_selesai timestamptz NOT NULL, created_at timestamp(0), updated_at timestamp(0),
  UNIQUE (id_kelas, waktu_mulai), UNIQUE (id_guru, waktu_mulai),
  CONSTRAINT jadwal_waktu_selesai_check CHECK (waktu_selesai > waktu_mulai));
CREATE TABLE presensi (
  id_presensi bigserial PRIMARY KEY,
  id_siswa bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  id_jadwal bigint NOT NULL REFERENCES jadwal(id_jadwal) ON DELETE RESTRICT,
  waktu_checkin timestamptz, status_kehadiran varchar(255) NOT NULL CHECK (status_kehadiran IN ('hadir','terlambat','izin','sakit','alpa')),
  lokasi_lat numeric(10,7), lokasi_lng numeric(10,7),
  status_validasi_lokasi varchar(255) NOT NULL DEFAULT 'belum_divalidasi' CHECK (status_validasi_lokasi IN ('valid','tidak_valid','belum_divalidasi')),
  created_at timestamp(0), updated_at timestamp(0), UNIQUE (id_siswa, id_jadwal),
  CONSTRAINT presensi_lat_check CHECK (lokasi_lat BETWEEN -90 AND 90),
  CONSTRAINT presensi_lng_check CHECK (lokasi_lng BETWEEN -180 AND 180),
  CONSTRAINT presensi_lat_lng_berpasangan_check CHECK ((lokasi_lat IS NULL) = (lokasi_lng IS NULL)));
CREATE TABLE materi (
  id_materi bigserial PRIMARY KEY, judul varchar(255) NOT NULL, file varchar(500) NOT NULL,
  id_mapel bigint NOT NULL REFERENCES mata_pelajaran(id_mapel) ON DELETE RESTRICT, created_at timestamp(0), updated_at timestamp(0));
CREATE TABLE tugas (
  id_tugas bigserial PRIMARY KEY, judul varchar(255) NOT NULL, instruksi text NOT NULL, batas_waktu timestamptz NOT NULL,
  lampiran varchar(500), id_mapel bigint NOT NULL REFERENCES mata_pelajaran(id_mapel) ON DELETE RESTRICT,
  created_at timestamp(0), updated_at timestamp(0));
CREATE TABLE pengumpulan_tugas (
  id_pengumpulan bigserial PRIMARY KEY,
  id_siswa bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  id_tugas bigint NOT NULL REFERENCES tugas(id_tugas) ON DELETE RESTRICT,
  jawaban_file varchar(500) NOT NULL,
  status varchar(255) NOT NULL DEFAULT 'dikumpulkan' CHECK (status IN ('dikumpulkan','terlambat','dinilai')),
  waktu_kumpul timestamptz NOT NULL, created_at timestamp(0), updated_at timestamp(0),
  UNIQUE (id_siswa, id_tugas), UNIQUE (id_pengumpulan, id_siswa));
CREATE TABLE kuis (
  id_kuis bigserial PRIMARY KEY, judul varchar(255) NOT NULL, tautan_google_form varchar(2048) NOT NULL,
  id_mapel bigint NOT NULL REFERENCES mata_pelajaran(id_mapel) ON DELETE RESTRICT, created_at timestamp(0), updated_at timestamp(0));
CREATE TABLE nilai (
  id_nilai bigserial PRIMARY KEY,
  id_siswa bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  id_pengumpulan bigint, id_kuis bigint REFERENCES kuis(id_kuis) ON DELETE RESTRICT,
  nilai numeric(5,2) NOT NULL, umpan_balik text, created_at timestamp(0), updated_at timestamp(0),
  FOREIGN KEY (id_pengumpulan, id_siswa) REFERENCES pengumpulan_tugas(id_pengumpulan, id_siswa) ON DELETE RESTRICT,
  UNIQUE (id_pengumpulan), UNIQUE (id_siswa, id_kuis),
  CONSTRAINT nilai_sumber_tunggal_check CHECK ((id_pengumpulan IS NULL) <> (id_kuis IS NULL)),
  CONSTRAINT nilai_rentang_check CHECK (nilai BETWEEN 0 AND 100));
CREATE TABLE pengumuman (
  id_pengumuman bigserial PRIMARY KEY, judul varchar(255) NOT NULL, isi text NOT NULL,
  cakupan varchar(255) NOT NULL CHECK (cakupan IN ('global','mapel')),
  id_penulis bigint NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  id_mapel bigint REFERENCES mata_pelajaran(id_mapel) ON DELETE RESTRICT, created_at timestamp(0), updated_at timestamp(0),
  CONSTRAINT pengumuman_cakupan_mapel_check CHECK ((cakupan='global' AND id_mapel IS NULL) OR (cakupan='mapel' AND id_mapel IS NOT NULL)));

-- Helper: operasi HARUS gagal dengan kode integritas (23xxx); kalau berhasil -> error.
CREATE FUNCTION harus_gagal(sql text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE sql;
  EXCEPTION WHEN integrity_constraint_violation OR check_violation THEN
    RAISE NOTICE 'OK  ditolak : %', label; RETURN;
  END;
  RAISE EXCEPTION 'GAGAL: seharusnya ditolak -> %', label;
END $$;
CREATE FUNCTION harus_lolos(sql text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN EXECUTE sql; RAISE NOTICE 'OK  diterima : %', label; END $$;

-- Data dasar
INSERT INTO pengguna(nisn,nip,username,password,peran) VALUES
 ('1111111111',NULL,NULL,'h','siswa'), ('2222222222',NULL,NULL,'h','siswa'),
 (NULL,'198001010000000001','guru1','h','guru'), (NULL,NULL,NULL,'h','admin'), (NULL,NULL,NULL,'h','admin');
INSERT INTO kelas(nama_kelas,id_wali) VALUES ('7A',3);
INSERT INTO mata_pelajaran(nama_mapel,id_guru) VALUES ('Matematika',3);
INSERT INTO siswa_kelas(id_siswa,id_kelas) VALUES (1,1);
INSERT INTO jadwal(id_mapel,id_kelas,id_guru,waktu_mulai,waktu_selesai) VALUES (1,1,3,'2026-10-19 07:00+07','2026-10-19 08:00+07');
INSERT INTO tugas(judul,instruksi,batas_waktu,id_mapel) VALUES ('T1','i','2026-10-30 00:00+07',1);
INSERT INTO pengumpulan_tugas(id_siswa,id_tugas,jawaban_file,waktu_kumpul) VALUES (1,1,'f.pdf',now());
INSERT INTO kuis(judul,tautan_google_form,id_mapel) VALUES ('K1','https://x',1);

-- Unique / nullable (pengguna)
SELECT harus_lolos($$INSERT INTO pengguna(password,peran) VALUES ('h','admin'),('h','admin')$$, 'banyak pengguna dengan nisn/nip/username NULL');
SELECT harus_gagal($$INSERT INTO pengguna(nisn,password,peran) VALUES ('1111111111','h','siswa')$$, 'nisn ganda');
SELECT harus_gagal($$INSERT INTO pengguna(nip,password,peran) VALUES ('198001010000000001','h','guru')$$, 'nip ganda');
SELECT harus_gagal($$INSERT INTO pengguna(username,password,peran) VALUES ('guru1','h','guru')$$, 'username ganda');
SELECT harus_gagal($$INSERT INTO pengguna(password,peran) VALUES ('h','kepsek')$$, 'peran di luar enum');
SELECT harus_gagal($$INSERT INTO pengguna(peran) VALUES ('siswa')$$, 'password NOT NULL');
-- siswa_kelas
SELECT harus_gagal($$INSERT INTO siswa_kelas(id_siswa,id_kelas) VALUES (1,1)$$, 'pasangan siswa-kelas ganda');
SELECT harus_lolos($$INSERT INTO siswa_kelas(id_siswa,id_kelas) VALUES (2,1)$$, 'siswa lain di kelas yang sama');
-- FK
SELECT harus_gagal($$INSERT INTO kelas(nama_kelas,id_wali) VALUES ('X',999)$$, 'FK yatim kelas.id_wali');
SELECT harus_gagal($$DELETE FROM pengguna WHERE id_pengguna=3$$, 'hapus guru yang masih dirujuk (RESTRICT)');
-- jadwal
SELECT harus_gagal($$INSERT INTO jadwal(id_mapel,id_kelas,id_guru,waktu_mulai,waktu_selesai) VALUES (1,1,3,'2026-10-20 08:00+07','2026-10-20 07:00+07')$$, 'selesai < mulai');
SELECT harus_gagal($$INSERT INTO jadwal(id_mapel,id_kelas,id_guru,waktu_mulai,waktu_selesai) VALUES (1,1,3,'2026-10-19 07:00+07','2026-10-19 09:00+07')$$, 'slot kelas/guru bentrok');
-- presensi
SELECT harus_lolos($$INSERT INTO presensi(id_siswa,id_jadwal,waktu_checkin,status_kehadiran,lokasi_lat,lokasi_lng,status_validasi_lokasi) VALUES (1,1,now(),'hadir',-6.2,106.8,'valid')$$, 'presensi hadir + lokasi');
SELECT harus_lolos($$INSERT INTO presensi(id_siswa,id_jadwal,status_kehadiran) VALUES (2,1,'izin')$$, 'presensi izin tanpa checkin/lokasi (default belum_divalidasi)');
SELECT harus_gagal($$INSERT INTO presensi(id_siswa,id_jadwal,status_kehadiran) VALUES (1,1,'hadir')$$, 'presensi ganda siswa+jadwal');
SELECT harus_gagal($$INSERT INTO presensi(id_siswa,id_jadwal,status_kehadiran,lokasi_lat,lokasi_lng) VALUES (4,1,'hadir',95,106)$$, 'lat > 90');
SELECT harus_gagal($$INSERT INTO presensi(id_siswa,id_jadwal,status_kehadiran,lokasi_lat,lokasi_lng) VALUES (4,1,'hadir',-6,190)$$, 'lng > 180');
SELECT harus_gagal($$INSERT INTO presensi(id_siswa,id_jadwal,status_kehadiran,lokasi_lat) VALUES (4,1,'hadir',-6)$$, 'lat tanpa lng');
-- pengumpulan
SELECT harus_gagal($$INSERT INTO pengumpulan_tugas(id_siswa,id_tugas,jawaban_file,waktu_kumpul) VALUES (1,1,'g.pdf',now())$$, 'pengumpulan ganda siswa+tugas');
-- nilai (Aturan E)
SELECT harus_lolos($$INSERT INTO nilai(id_siswa,id_pengumpulan,nilai) VALUES (1,1,85.5)$$, 'nilai dari pengumpulan saja');
SELECT harus_lolos($$INSERT INTO nilai(id_siswa,id_kuis,nilai,umpan_balik) VALUES (1,1,70,NULL)$$, 'nilai dari kuis saja (umpan_balik NULL)');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,nilai) VALUES (2,80)$$, 'nilai tanpa sumber');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_pengumpulan,id_kuis,nilai) VALUES (1,1,1,80)$$, 'nilai dengan dua sumber');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_pengumpulan,nilai) VALUES (2,1,80)$$, 'siswa bukan pemilik pengumpulan (FK komposit)');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_pengumpulan,nilai) VALUES (1,1,90)$$, 'dua nilai untuk satu pengumpulan');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_kuis,nilai) VALUES (1,1,90)$$, 'dua nilai siswa yang sama untuk satu kuis');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_kuis,nilai) VALUES (2,1,100.5)$$, 'nilai > 100');
SELECT harus_gagal($$INSERT INTO nilai(id_siswa,id_kuis,nilai) VALUES (2,1,-1)$$, 'nilai < 0');
SELECT harus_lolos($$INSERT INTO nilai(id_siswa,id_kuis,nilai) VALUES (2,1,0)$$, 'nilai 0 diterima');
-- pengumuman
SELECT harus_lolos($$INSERT INTO pengumuman(judul,isi,cakupan,id_penulis) VALUES ('a','b','global',4)$$, 'pengumuman global tanpa mapel');
SELECT harus_lolos($$INSERT INTO pengumuman(judul,isi,cakupan,id_penulis,id_mapel) VALUES ('a','b','mapel',3,1)$$, 'pengumuman mapel dengan mapel');
SELECT harus_gagal($$INSERT INTO pengumuman(judul,isi,cakupan,id_penulis,id_mapel) VALUES ('a','b','global',4,1)$$, 'global tapi punya mapel');
SELECT harus_gagal($$INSERT INTO pengumuman(judul,isi,cakupan,id_penulis) VALUES ('a','b','mapel',3)$$, 'mapel tanpa mapel');
SELECT harus_gagal($$INSERT INTO pengumuman(judul,isi,cakupan,id_penulis) VALUES ('a','b','lainnya',3)$$, 'cakupan di luar enum');
-- Perilaku hapus
SELECT harus_gagal($$DELETE FROM kelas WHERE id_kelas=1$$, 'hapus kelas yang masih punya jadwal (RESTRICT)');
INSERT INTO kelas(nama_kelas,id_wali) VALUES ('7B',3);
INSERT INTO siswa_kelas(id_siswa,id_kelas) SELECT 1, id_kelas FROM kelas WHERE nama_kelas='7B';
DELETE FROM kelas WHERE nama_kelas='7B';
DO $$ BEGIN
  IF (SELECT count(*) FROM siswa_kelas) <> 2 THEN RAISE EXCEPTION 'GAGAL: cascade siswa_kelas (jumlah=%)', (SELECT count(*) FROM siswa_kelas); END IF;
  IF NOT EXISTS (SELECT 1 FROM pengguna WHERE id_pengguna=1) THEN RAISE EXCEPTION 'GAGAL: pengguna ikut terhapus'; END IF;
  RAISE NOTICE 'OK  cascade: hapus kelas menghapus keanggotaan, pengguna aman';
END $$;
