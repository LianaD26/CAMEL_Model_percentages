
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
INDICADOR_IRL = "Activos líquidos ampliados / depósitos a corto plazo"

# Percentiles que se van a calcular y guardar
PERCENTILES = [20, 40, 60, 80]


# ======================================================
# CALCULAR PERCENTILES
# ======================================================

def calcular_percentiles(df, indicadores):

    resultados = {}

    primer_corte = PERCENTILES[0]       # 20
    cortes_restantes = PERCENTILES[1:]  # [40, 60, 80]

    for indicador in indicadores:

        subset = df[df["ID_indicador"] == indicador].copy()

        if subset.empty:
            continue

        valores = subset["valor"].dropna()

        if valores.empty:
            continue

        # ----------------------------------
        # IRL → aplicar log10(x)
        # ----------------------------------
        if indicador == INDICADOR_IRL:

            valores = valores[valores > 0]

            if valores.empty:
                continue

            valores = np.log10(valores)

        # ----------------------------------
        # Detectar muchos ceros
        # ----------------------------------
        porcentaje_ceros = (valores == 0).mean()

        if porcentaje_ceros >= 0.10:

            valores_sin_cero = valores[valores > 0]

            p = {}

            # P20 = 0
            p[primer_corte] = 0

            if not valores_sin_cero.empty:

                for q in cortes_restantes:

                    q_ajustado = (
                        (q - primer_corte)
                        / (100 - primer_corte)
                    )

                    p[q] = valores_sin_cero.quantile(q_ajustado)

            else:

                for q in cortes_restantes:
                    p[q] = 0

        else:

            # Calcular únicamente P20, P40, P60 y P80
            p = {
                q: valores.quantile(q / 100)
                for q in PERCENTILES
            }

        # ----------------------------------
        # Relación solvencia → P20 = 9
        # ----------------------------------
        if indicador == INDICADOR_SOLVENCIA:

            p[primer_corte] = 9

            for q in cortes_restantes:

                p[q] = max(
                    p[q],
                    p[primer_corte]
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

        # Mayor que P80
        return 5

    else:

        limites_valores = [x[1] for x in limites]

        for i, limite in enumerate(reversed(limites_valores)):

            if valor >= limite:
                return i + 1

        # Menor que P20
        return 5


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


# ======================================================
# GUARDAR PERCENTILES EN BD
# ======================================================

def calcular_y_guardar_percentiles():

    current_dir = os.path.dirname(
        os.path.abspath(__file__)
    )

    csv_path = os.path.join(
        current_dir,
        "Registros_CAMEL_sin_solvencia_categorizados.csv"
    )

    load_dotenv(
        dotenv_path=os.path.join(
            current_dir,
            ".env"
        )
    )

    df = pd.read_csv(csv_path)

    # ==================================================
    # TRANSFORMACIONES
    # ==================================================
    # Las cooperativas "Top 4" se tratan como "Megas"
    df["categoria"] = df["categoria"].replace(
        "Top 4",
        "Megas"
    )

    # Cambiar nombre del IRL para que coincida
    # con el nombre almacenado en camel_indicator
    df["ID_indicador"] = df["ID_indicador"].replace(
        "Indicador de Riesgo de Liquidez - IRL",
        "Activos líquidos ampliados / depósitos a corto plazo"
    )

    # ==================================================
    # LIMPIAR COLUMNA VALOR
    # ==================================================

    df["valor"] = df["valor"].fillna(0)
    df["valor"] = (
        df["valor"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
    )

    df["valor"] = pd.to_numeric(
        df["valor"],
        errors="coerce"
    )

    # ==================================================
    # CATEGORÍAS
    # ==================================================

    categorias = (
        ["General"]
        + sorted(
            df["categoria"]
            .dropna()
            .unique()
            .tolist()
        )
    )

    # ==================================================
    # CONEXIÓN A NEON
    # ==================================================

    conn = psycopg2.connect(
        host=os.getenv("NEON_HOST"),
        user=os.getenv("NEON_USER"),
        password=os.getenv("NEON_PASSWORD"),
        database=os.getenv("NEON_DATABASE"),
        port=os.getenv("NEON_PORT", 5432),
        sslmode="require",
        connect_timeout=10
    )

    conn.set_session(
        autocommit=False
    )

    cursor = conn.cursor()

    # ==================================================
    # MAPEO INDICADOR → ID
    # ==================================================

    cursor.execute(
        "SELECT id_indicator, name FROM camel_indicator"
    )

    mapa_indicador = {
        name: id_indicator
        for id_indicator, name in cursor.fetchall()
    }

    # ==================================================
    # ELIMINAR RESULTADOS ANTERIORES
    # ==================================================

    cursor.execute(
        "DELETE FROM percentile_result"
    )

    total_filas = 0

    # ==================================================
    # CALCULAR POR CATEGORÍA
    # ==================================================

    for categoria in categorias:

        if categoria == "General":

            df_cat = df

        else:

            df_cat = df[
                df["categoria"] == categoria
            ]

        if df_cat.empty:
            continue

        indicadores = (
            df_cat["ID_indicador"]
            .dropna()
            .unique()
        )

        percentiles = calcular_percentiles(
            df_cat,
            indicadores
        )

        quantity_cooperatives = int(
            df_cat["ID_cooperativa"].nunique()
        )

        quantity_records = int(
            len(df_cat)
        )

        insertados = 0

        # ==================================================
        # GUARDAR CADA INDICADOR
        # ==================================================

        for nombre_indicador, p in percentiles.items():

            id_indicator = mapa_indicador.get(
                nombre_indicador
            )

            if id_indicator is None:

                print(
                    f"  ⚠ Indicador sin mapear en BD: "
                    f"{nombre_indicador}"
                )

                continue

            # ==================================================
            # VALIDAR QUE EXISTAN LOS 4 PERCENTILES
            # ==================================================

            faltantes = [
                q
                for q in PERCENTILES
                if q not in p
            ]

            if faltantes:

                print(
                    f"  ⚠ {nombre_indicador}: "
                    f"faltan percentiles {faltantes}. "
                    f"No se guardará."
                )

                continue

            # ==================================================
            # SOLO P20, P40, P60 Y P80
            # ==================================================

            valores_p = [
                float(p[q])
                for q in PERCENTILES
            ]

            # ==================================================
            # INSERTAR / ACTUALIZAR
            # ==================================================

            cursor.execute(
                """
                INSERT INTO percentile_result
                    (
                        category,
                        quantity_cooperatives,
                        quantity_records,
                        id_indicator,
                        p20,
                        p40,
                        p60,
                        p80
                    )
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s)

                ON CONFLICT (category, id_indicator)
                DO UPDATE SET
                    quantity_cooperatives =
                        EXCLUDED.quantity_cooperatives,

                    quantity_records =
                        EXCLUDED.quantity_records,

                    p20 =
                        EXCLUDED.p20,

                    p40 =
                        EXCLUDED.p40,

                    p60 =
                        EXCLUDED.p60,

                    p80 =
                        EXCLUDED.p80
                """,
                (
                    categoria,
                    quantity_cooperatives,
                    quantity_records,
                    id_indicator,
                    *valores_p
                )
            )

            insertados += 1

        total_filas += insertados

        print(
            f"✓ {categoria}: "
            f"{insertados} indicadores "
            f"({quantity_cooperatives} coops, "
            f"{quantity_records} registros)"
        )

    # ==================================================
    # CONFIRMAR CAMBIOS
    # ==================================================

    conn.commit()

    cursor.close()
    conn.close()

    print(
        f"\n✓ Percentiles guardados en la BD: "
        f"{total_filas} filas en percentile_result"
    )


# ======================================================
# EJECUCIÓN
# ======================================================

if __name__ == "__main__":
    calcular_y_guardar_percentiles()
