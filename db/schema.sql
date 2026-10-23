DO $$ BEGIN
    CREATE TYPE divisi_enum AS ENUM (
        'admin',
        'manjemen',
        'desainer',
        'sheet_metal',
        'expanding',
        'piping_brazing',
        'perakitan_indoor',
        'perakitan_outdoor',
        'quality_assurance',
        'gudang'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE status_job_enum AS ENUM (
        'pending',
        'proses',
        'selesai',
        'dibatalkan'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS pelanggan (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama                VARCHAR(100) NOT NULL,
    nomor_telepon       VARCHAR(20),
    email               VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS job_orders (
    nomor               VARCHAR(20) PRIMARY KEY,
    id_pelanggan        UUID NOT NULL REFERENCES pelanggan(id),
    tanggal_terima      DATE DEFAULT CURRENT_DATE,
    tanggal_selesai     DATE NOT NULL,
    persentase          INT NOT NULL DEFAULT 0,
    status              status_job_enum NOT NULL DEFAULT 'pending',
    divisi_pengerjaan   divisi_enum,
    menunggu_terima     BOOLEAN NOT NULL DEFAULT FALSE,
    diterima_pada       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS job_orders_divisi_idx ON job_orders (divisi_pengerjaan);

ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS menunggu_terima BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS diterima_pada TIMESTAMPTZ;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_orders' AND column_name = 'diterima_pada'
          AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE job_orders
            ALTER COLUMN diterima_pada TYPE TIMESTAMPTZ
            USING diterima_pada AT TIME ZONE 'UTC';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS job_order_produk (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor               VARCHAR(20) NOT NULL REFERENCES job_orders(nomor) ON DELETE CASCADE,
    nama                VARCHAR(150) NOT NULL,
    jumlah              NUMERIC(12,2) NOT NULL DEFAULT 1,
    keterangan          TEXT
);

CREATE INDEX IF NOT EXISTS job_order_produk_nomor_idx ON job_order_produk (nomor);

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(50) NOT NULL,
    password            VARCHAR(255) NOT NULL,
    divisi              divisi_enum NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unik ON users (username);

CREATE TABLE IF NOT EXISTS audit_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID,
    username            VARCHAR(50),
    aksi                VARCHAR(50) NOT NULL,
    detail              TEXT,
    dibuat_pada         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_dibuat_pada_idx ON audit_log (dibuat_pada DESC);
