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
    nombre_col_categoria="categoria",
    categoria="General",
    n_componentes=3
):
    
    # filtrar cooperativas
    df_filtrado = df[df[col_nombre].isin(lista_coops)].copy()
    
    # Si NO es General, filtrar por categoría específica
    if categoria != "General":
        df_filtrado = df_filtrado[df_filtrado[nombre_col_categoria] == categoria].copy()
    
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
    
    # PCA (componentes acotados por nº de muestras y de indicadores)
    n_comp = min(n_componentes, df_pivot.shape[0], df_pivot.shape[1])
    pca = PCA(n_components=n_comp)
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
    csv_path = os.path.join(current_dir, "Registros_CAMEL_sin_solvencia_categorizados.csv")
    load_dotenv(dotenv_path=os.path.join(current_dir, ".env"))

    datos = pd.read_csv(csv_path)
    # Las cooperativas "Top 4" se tratan como "Megas"
    datos["categoria"] = datos["categoria"].replace("Top 4", "Megas")
    lista_coops = datos["ID_cooperativa"].unique().tolist()

    # General (todas) + cada categoría presente en el CSV
    categorias = ["General"] + sorted(datos["categoria"].dropna().unique().tolist())

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
    cursor.execute("DELETE FROM pca_result")

    total_filas = 0

    for categoria in categorias:
        try:
            pesos = pesos_pca_grupo_coops(
                datos,
                lista_coops=lista_coops,
                col_nombre="ID_cooperativa",
                nombre_col_categoria="categoria",
                categoria=categoria,
                n_componentes=3
            )
        except ValueError as e:
            print(f"⚠ {categoria}: {e}")
            continue

        # Conteos para esta categoría
        if categoria == "General":
            df_cat = datos
        else:
            df_cat = datos[datos["categoria"] == categoria]

        quantity_cooperatives = int(df_cat["ID_cooperativa"].nunique())
        quantity_records = int(len(df_cat))

        insertados = 0
        for nombre_indicador, weight in pesos.items():
            id_indicator = mapa_indicador.get(nombre_indicador)
            if id_indicator is None:
                print(f"  ⚠ Indicador sin mapear en BD: {nombre_indicador}")
                continue

            weight = float(weight)
            weight_percentage = round(weight * 100, 2)

            cursor.execute(
                """
                INSERT INTO pca_result
                    (category, quantity_cooperatives, quantity_records,
                     id_indicator, weight, weight_percentage)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (category, id_indicator) DO UPDATE SET
                    quantity_cooperatives = EXCLUDED.quantity_cooperatives,
                    quantity_records = EXCLUDED.quantity_records,
                    weight = EXCLUDED.weight,
                    weight_percentage = EXCLUDED.weight_percentage
                """,
                (categoria, quantity_cooperatives, quantity_records,
                 id_indicator, weight, weight_percentage)
            )
            insertados += 1

        total_filas += insertados
        print(f"✓ {categoria}: {insertados} indicadores "
              f"({quantity_cooperatives} coops, {quantity_records} registros)")

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\n✓ PCA guardado en la BD: {total_filas} filas en pca_result")


if __name__ == "__main__":
    calcular_y_guardar_pca()