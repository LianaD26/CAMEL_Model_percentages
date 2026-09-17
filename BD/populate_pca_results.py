import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA


def pesos_pca_grupo_coops(
    df,
    lista_coops,
    col_nombre="ID_cooperativa",
    n_componentes=3
):
    
    # filtrar cooperativas
    df_filtrado = df[df[col_nombre].isin(lista_coops)].copy()
    
    if df_filtrado.empty:
        raise ValueError("No hay datos para las cooperativas indicadas")
    
    # LIMPIEZA 
    df_filtrado["valor"] = (
        df_filtrado["valor"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
    )
    
    df_filtrado["valor"] = pd.to_numeric(df_filtrado["valor"], errors="coerce")
    
    # pivot (matriz indicadores)
    df_pivot = df_filtrado.pivot_table(
        index=col_nombre,
        columns="ID_indicador",
        values="valor",
        aggfunc="mean"
    )
    
    # imputar faltantes
    imputer = SimpleImputer(strategy="mean")
    X_imputed = imputer.fit_transform(df_pivot)
    
    # escalar
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)
    
    # PCA
    pca = PCA(n_components=min(n_componentes, df_pivot.shape[1]))
    pca.fit(X_scaled)
    
    loadings = pd.DataFrame(
        pca.components_.T,
        index=df_pivot.columns
    )
    
    pesos = (loadings**2).mean(axis=1)
    
    # porcentaje
    pesos = (pesos / pesos.sum()) 
    
    return pesos.sort_values(ascending=False)


def calcular_y_guardar_pca():
    current_dir = os.path.dirname(os.path.abspath(__file__))

    csv_path = os.path.join(
        current_dir,
        "Registros_CAMEL_sin_solvencia_categorizados.csv"
    )

    load_dotenv(
        dotenv_path=os.path.join(current_dir, ".env")
    )

    datos = pd.read_csv(csv_path)

    # ==========================================
    # LIMPIEZA IGUAL A LA DEL NOTEBOOK
    # ==========================================

    # Nulos en valor -> 0
    datos["valor"] = datos["valor"].fillna(0)

    # Espacios -> 0
    datos["valor"] = datos["valor"].replace(" ", 0)

    # Valor -> float
    datos["valor"] = datos["valor"].astype(float)

    # Top 4 -> Megas
    datos["categoria"] = datos["categoria"].replace(
        "Top 4",
        "Megas"
    )

    # Renombrar indicador
    datos["ID_indicador"] = datos["ID_indicador"].replace(
        "Indicador de Riesgo de Liquidez - IRL",
        "Activos líquidos ampliados / depósitos a corto plazo"
    )

    # ==========================================
    # CATEGORÍAS
    # ==========================================

    categorias = [
        "General"
    ] + sorted(
        datos["categoria"]
        .dropna()
        .unique()
        .tolist()
    )

    # ==========================================
    # CONEXIÓN BD
    # ==========================================

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

    # ==========================================
    # MAPEO INDICADORES
    # ==========================================

    cursor.execute(
        "SELECT id_indicator, name FROM camel_indicator"
    )

    mapa_indicador = {
        name: id_indicator
        for id_indicator, name in cursor.fetchall()
    }

    # ==========================================
    # ELIMINAR RESULTADOS ANTERIORES
    # ==========================================

    cursor.execute("DELETE FROM pca_result")

    total_filas = 0

    # ==========================================
    # PCA POR CATEGORÍA
    # ==========================================

    for categoria in categorias:

        try:

            if categoria == "General":

                df_cat = datos.copy()

            else:

                df_cat = datos[
                    datos["categoria"] == categoria
                ].copy()

            # Lista de cooperativas de la categoría
            lista_coops = (
                df_cat["ID_cooperativa"]
                .dropna()
                .unique()
                .tolist()
            )

            pesos = pesos_pca_grupo_coops(
                df_cat,
                lista_coops=lista_coops,
                col_nombre="ID_cooperativa",
                n_componentes=3
            )

        except ValueError as e:

            print(f"⚠ {categoria}: {e}")
            continue

        # ==========================================
        # CONTEOS
        # ==========================================

        quantity_cooperatives = int(
            df_cat["ID_cooperativa"].nunique()
        )

        quantity_records = int(len(df_cat))

        insertados = 0

        # ==========================================
        # GUARDAR PESOS
        # ==========================================

        for nombre_indicador, weight in pesos.items():

            id_indicator = mapa_indicador.get(
                nombre_indicador
            )

            if id_indicator is None:

                print(
                    f"⚠ Indicador sin mapear en BD: "
                    f"{nombre_indicador}"
                )

                continue

            weight = float(weight)

            weight_percentage = round(
                weight * 100,
                2
            )

            cursor.execute(
                """
                INSERT INTO pca_result
                    (
                        category,
                        quantity_cooperatives,
                        quantity_records,
                        id_indicator,
                        weight,
                        weight_percentage
                    )
                VALUES (%s, %s, %s, %s, %s, %s)

                ON CONFLICT (category, id_indicator)
                DO UPDATE SET
                    quantity_cooperatives =
                        EXCLUDED.quantity_cooperatives,

                    quantity_records =
                        EXCLUDED.quantity_records,

                    weight =
                        EXCLUDED.weight,

                    weight_percentage =
                        EXCLUDED.weight_percentage
                """,
                (
                    categoria,
                    quantity_cooperatives,
                    quantity_records,
                    id_indicator,
                    weight,
                    weight_percentage
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

    # ==========================================
    # COMMIT
    # ==========================================

    conn.commit()

    cursor.close()
    conn.close()

    print(
        f"\n✓ PCA guardado en la BD: "
        f"{total_filas} filas en pca_result"
    )

if __name__ == "__main__":
    calcular_y_guardar_pca()