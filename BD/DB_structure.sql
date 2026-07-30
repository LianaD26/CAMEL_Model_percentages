-- ============================================================
-- 1. CAMEL LEVELS
-- ============================================================

CREATE TABLE camel_level (
    id_camel SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- 2. CAMEL INDICATORS
-- ============================================================

CREATE TABLE camel_indicator (
    id_indicator SERIAL PRIMARY KEY,
    id_camel INT NOT NULL,
    name VARCHAR(150) NOT NULL,

    CONSTRAINT fk_camel_indicator_level
        FOREIGN KEY (id_camel)
        REFERENCES camel_level(id_camel)
        ON DELETE CASCADE,

    CONSTRAINT uq_camel_indicator
        UNIQUE(id_camel, name)
);

-- ============================================================
-- 3. SUPERFIN INDICATORS
-- ============================================================

CREATE TABLE superfin_indicator (
    id_indicator SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- 4. COOPERATIVES
-- ============================================================

CREATE TABLE cooperative (
    id_cooperative SERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL
);

-- ============================================================
-- 5. SUPERFIN REGISTERS
-- ============================================================

CREATE TABLE superfin_record (
    id_record SERIAL PRIMARY KEY,

    id_indicator INT NOT NULL,
    id_cooperative INT NOT NULL,

    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL,

    value NUMERIC(20,10) NOT NULL,

    CONSTRAINT fk_superfin_record_indicator
        FOREIGN KEY (id_indicator)
        REFERENCES superfin_indicator(id_indicator)
        ON DELETE CASCADE,

    CONSTRAINT fk_superfin_record_cooperative
        FOREIGN KEY (id_cooperative)
        REFERENCES cooperative(id_cooperative)
        ON DELETE CASCADE,

    CONSTRAINT uq_superfin_record
        UNIQUE(id_indicator, id_cooperative, year, month)
);

-- ============================================================
-- 6. CAMEL REGISTERS
-- ============================================================

CREATE TABLE camel_record (
    id_record SERIAL PRIMARY KEY,

    id_indicator INT NOT NULL,
    id_cooperative INT NOT NULL,

    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL,

    value NUMERIC(20,10) NOT NULL,

    CONSTRAINT fk_camel_record_indicator
        FOREIGN KEY (id_indicator)
        REFERENCES camel_indicator(id_indicator)
        ON DELETE CASCADE,

    CONSTRAINT fk_camel_record_cooperative
        FOREIGN KEY (id_cooperative)
        REFERENCES cooperative(id_cooperative)
        ON DELETE CASCADE,

    CONSTRAINT uq_camel_record
        UNIQUE(id_indicator, id_cooperative, year, month)
);

