import os
import pandas as pd
import numpy as np
import psycopg2
from dotenv import load_dotenv

INDICADORES_INVERSOS = [
    "Indicador de calidad por riesgo",
    "Indicador de calidad por riesgo con castigos",
    "Indicador de Cobertura de la Cartera Total en Riesgo",
    "Indicador de relación entre las obligaciones financieras y el pasivo total",
    "Indicador de Margen Financiero de Operación",
    "Indicador de Margen Operacional"
]

INDICADOR_SOLVENCIA = "Relación Solvencia"
INDICADOR_IRL = "IRL"

PERCENTILES = [10,20,30,40,50,60,70,80,90]


# ======================================================
# CALCULAR PERCENTILES
# ======================================================

def calcular_percentiles(df, indicadores):

    resultados = {}

    for indicador in indicadores:

        subset = df[df["ID_indicador"] == indicador].copy()

        if subset.empty:
            continue

        valores = subset["valor"].dropna()

        # ----------------------------------
        # IRL → aplicar log10(x)
        # ----------------------------------
        if indicador== INDICADOR_IRL:

            valores = valores[valores > 0]

            if len(valores) == 0:
                continue

            valores = np.log10(valores)

        # ----------------------------------
        # Detectar muchos ceros
        # ----------------------------------
        porcentaje_ceros = (valores == 0).mean()

        if porcentaje_ceros >= 0.10:

            valores_sin_cero = valores[valores > 0]

            p = {}

            # P10 = 0
            p[10] = 0

            if len(valores_sin_cero) > 0:

                for q in [20,30,40,50,60,70,80,90]:

                    q_ajustado = (q - 10) / 90

                    p[q] = valores_sin_cero.quantile(q_ajustado)

            else:

                for q in [20,30,40,50,60,70,80,90]:
                    p[q] = 0

        else:

            p = {
                q: valores.quantile(q / 100)
                for q in PERCENTILES
            }

        # ----------------------------------
        # Relación solvencia → P10 = 9
        # ----------------------------------
        if indicador == INDICADOR_SOLVENCIA:

            p[10] = 9

            for q in [20,30,40,50,60,70,80,90]:

                p[q] = max(
                    p[q],
                    p[10]
                )

        resultados[indicador] = p

    return resultados


# ======================================================
# ASIGNAR CALIFICACIÓN
# ======================================================

def asignar_calificacion(valor, cortes, inverso=False):

    limites = sorted(cortes.items())

    if not inverso:

        for i, (_, limite) in enumerate(limites):

            if valor <= limite:
                return i + 1

        return 10

    else:

        limites_valores = [x[1] for x in limites]

        for i, limite in enumerate(reversed(limites_valores)):

            if valor >= limite:
                return i + 1

        return 10


# ======================================================
# CALIFICAR DATAFRAME
# ======================================================

def calificar_dataframe(df):

    df = df.copy()

    indicadores = df["ID_indicador"].unique()

    percentiles = calcular_percentiles(
        df,
        indicadores
    )

    calificaciones = []

    for _, row in df.iterrows():

        indicador = row["ID_indicador"]

        valor = row["valor"]

        if pd.isna(valor):
            calificaciones.append(None)
            continue

        # -------------------------
        # IRL → aplicar log10
        # -------------------------
        if indicador == INDICADOR_IRL:

            if valor <= 0:
                calificaciones.append(None)
                continue

            valor = np.log10(valor)

        inverso = indicador in INDICADORES_INVERSOS

        nota = asignar_calificacion(
            valor=valor,
            cortes=percentiles[indicador],
            inverso=inverso
        )

        calificaciones.append(nota)

    df["calificacion"] = calificaciones

    return df, percentiles

datos=pd.read_csv("Registros_CAMEL_sin_solvencia_categorizados.csv")


def calcular_y_guardar_percentiles():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "Registros_CAMEL_sin_solvencia_categorizados.csv")
    load_dotenv(dotenv_path=os.path.join(current_dir, ".env"))

    df = pd.read_csv(csv_path)
    # Las cooperativas "Top 4" se tratan como "Megas"
    df["categoria"] = df["categoria"].replace("Top 4", "Megas")

    # Limpiar la columna valor a numérico
    df["valor"] = (
        df["valor"].astype(str).str.replace(",", "", regex=False).str.strip()
    )
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")

    # General (todas) + cada categoría presente en el CSV
    categorias = ["General"] + sorted(df["categoria"].dropna().unique().tolist())

    # Conectar a Neon
    conn = psycopg2.connect(
        host=os.getenv("NEON_HOST"),
        user=os.getenv("NEON_USER"),
        password=os.getenv("NEON_PASSWORD"),
        database=os.getenv("NEON_DATABASE"),
        port=os.getenv("NEON_PORT", 5432),
        sslmode="require",
        connect_timeout=10
    )
    conn.set_session(autocommit=False)
    cursor = conn.cursor()

    # Mapeo nombre_indicador -> id_indicator desde la BD
    cursor.execute("SELECT id_indicator, name FROM camel_indicator")
    mapa_indicador = {name: id_indicator for id_indicator, name in cursor.fetchall()}

    # Reemplazar resultados anteriores (la tabla guarda solo el último cálculo)
    cursor.execute("DELETE FROM percentile_result")

    total_filas = 0

    for categoria in categorias:
        if categoria == "General":
            df_cat = df
        else:
            df_cat = df[df["categoria"] == categoria]

        if df_cat.empty:
            continue

        indicadores = df_cat["ID_indicador"].unique()
        percentiles = calcular_percentiles(df_cat, indicadores)

        quantity_cooperatives = int(df_cat["ID_cooperativa"].nunique())
        quantity_records = int(len(df_cat))

        insertados = 0
        for nombre_indicador, p in percentiles.items():
            id_indicator = mapa_indicador.get(nombre_indicador)
            if id_indicator is None:
                print(f"  ⚠ Indicador sin mapear en BD: {nombre_indicador}")
                continue

            valores_p = [None if p.get(q) is None else float(p.get(q))
                         for q in [10, 20, 30, 40, 50, 60, 70, 80, 90]]

            cursor.execute(
                """
                INSERT INTO percentile_result
                    (category, quantity_cooperatives, quantity_records,
                     id_indicator, p10, p20, p30, p40, p50, p60, p70, p80, p90)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (category, id_indicator) DO UPDATE SET
                    quantity_cooperatives = EXCLUDED.quantity_cooperatives,
                    quantity_records = EXCLUDED.quantity_records,
                    p10 = EXCLUDED.p10, p20 = EXCLUDED.p20, p30 = EXCLUDED.p30,
                    p40 = EXCLUDED.p40, p50 = EXCLUDED.p50, p60 = EXCLUDED.p60,
                    p70 = EXCLUDED.p70, p80 = EXCLUDED.p80, p90 = EXCLUDED.p90
                """,
                (categoria, quantity_cooperatives, quantity_records,
                 id_indicator, *valores_p)
            )
            insertados += 1

        total_filas += insertados
        print(f"✓ {categoria}: {insertados} indicadores "
              f"({quantity_cooperatives} coops, {quantity_records} registros)")

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\n✓ Percentiles guardados en la BD: {total_filas} filas en percentile_result")


if __name__ == "__main__":
    calcular_y_guardar_percentiles()