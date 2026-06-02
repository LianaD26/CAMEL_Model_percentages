from sklearn.preprocessing import MinMaxScaler
import pandas as pd
from app.services.cargar_datos_pca import cargar_datos
from sklearn.decomposition import PCA

def promedio_indicadores():
    # --- 1. Cargar datos ---
    df = cargar_datos()

    # --- 2. Seleccionar columnas numéricas de indicadores ---
    indicadores = [
        col for col in df.columns if col not in [
            "ano", "mes", "ID_cooperativa", "cooperativa_nombre", "Periodo"
        ]
    ]

    # --- 3. Escalar los indicadores ---
    scaler = MinMaxScaler()
    df_scaled = pd.DataFrame(scaler.fit_transform(df[indicadores]), columns=indicadores)

    # --- 4. Aplicar PCA ---
    pca = PCA()
    pca.fit(df_scaled)

    # Cargas absolutas (importancia de cada variable en cada componente)
    cargas = pd.DataFrame(abs(pca.components_), columns=indicadores)

    # Varianza explicada por cada componente
    varianza = pca.explained_variance_ratio_

    # --- 5. Calcular la "importancia total" de cada indicador ---
    # Promedio ponderado de las cargas según la varianza explicada
    importancia = (cargas.T @ varianza).to_numpy().flatten()
    importancia_df = pd.DataFrame({
        "Indicador": indicadores,
        "Importancia_PCA": importancia
    })

    # --- 6. Calcular promedio global normalizado (como antes) ---
    promedios = (
        df_scaled.mean()
        .reset_index()
        .rename(columns={"index": "Indicador", 0: "Promedio"})
    )

    # --- 7. Combinar ambos resultados ---
    promedios = promedios.merge(importancia_df, on="Indicador", how="left")

    # --- 8. Calcular pesos combinados (basados en PCA) ---
    total_importancia = promedios["Importancia_PCA"].sum()
    promedios["Peso (%)"] = (promedios["Importancia_PCA"] / total_importancia * 100).round(2)

    # --- 9. Ordenar y redondear ---
    promedios["Promedio"] = promedios["Promedio"].round(4)
    promedios = promedios.sort_values(by="Peso (%)", ascending=False).reset_index(drop=True)

    return promedios

