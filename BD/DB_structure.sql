-- ============================================================
-- BASE DE DATOS CAMEL
-- ============================================================

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
-- 3. COOPERATIVES
-- ============================================================

CREATE TABLE cooperative (
    id_cooperative SERIAL PRIMARY KEY,

    name VARCHAR(250) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL
);


-- ============================================================
-- 4. CAMEL RECORDS
-- ============================================================
-- Contiene los datos utilizados para realizar los cálculos
-- del modelo CAMEL.

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


-- ============================================================
-- 5. PCA RESULTS
-- ============================================================
-- Contiene únicamente el resultado del último cálculo del PCA.
--
-- Cada combinación:
--     category + indicator
-- debe ser única.
--
-- Cuando se vuelva a calcular el PCA, se eliminan los
-- resultados anteriores y se insertan los nuevos.

CREATE TABLE pca_result (
    id_pca_result SERIAL PRIMARY KEY,

    category VARCHAR(100) NOT NULL,

    quantity_cooperatives INT NOT NULL,
    quantity_records INT NOT NULL,

    id_indicator INT NOT NULL,

    weight NUMERIC(20,10) NOT NULL,
    weight_percentage NUMERIC(20,10) NOT NULL,

    CONSTRAINT fk_pca_result_indicator
        FOREIGN KEY (id_indicator)
        REFERENCES camel_indicator(id_indicator)
        ON DELETE CASCADE,

    CONSTRAINT uq_pca_result
        UNIQUE(category, id_indicator)
);


-- ============================================================
-- 6. PERCENTILE RESULTS
-- ============================================================
-- Contiene únicamente el resultado del último cálculo
-- de percentiles.
--
-- Cada indicador tiene sus percentiles P10 - P90
-- para cada categoría.

CREATE TABLE percentile_result (
    id_percentile_result SERIAL PRIMARY KEY,

    category VARCHAR(100) NOT NULL,

    quantity_cooperatives INT NOT NULL,
    quantity_records INT NOT NULL,

    id_indicator INT NOT NULL,

    p20 NUMERIC(20,10),
    p40 NUMERIC(20,10),
    p60 NUMERIC(20,10),
    p80 NUMERIC(20,10),

    CONSTRAINT fk_percentile_result_indicator
        FOREIGN KEY (id_indicator)
        REFERENCES camel_indicator(id_indicator)
        ON DELETE CASCADE,

    CONSTRAINT uq_percentile_result
        UNIQUE(category, id_indicator)
);

CREATE TABLE camel_result (
    id_camel_result SERIAL PRIMARY KEY,

    id_cooperative INT NOT NULL,

    category VARCHAR(100) NOT NULL,

    result NUMERIC(20,10) NOT NULL,

    CONSTRAINT fk_camel_result_cooperative
        FOREIGN KEY (id_cooperative)
        REFERENCES cooperative(id_cooperative)
        ON DELETE CASCADE,

    CONSTRAINT uq_camel_result
        UNIQUE(id_cooperative, category)
);