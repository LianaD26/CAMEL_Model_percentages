from sklearn.preprocessing import MinMaxScaler
import pandas as pd
from app.services.cargar_datos_pca import cargar_datos

def promedio_indicadores():
    df = cargar_datos()

    indicadores = [col for col in df.columns if col not in [
        "ano", "mes", "ID_cooperativa", "cooperativa_nombre", "Periodo"
    ]]

    # Escalar los indicadores al rango [0, 1]
    scaler = MinMaxScaler()
    df_scaled = pd.DataFrame(scaler.fit_transform(df[indicadores]), columns=indicadores)

    # Calcular el promedio global
    promedios = (
        df_scaled.mean()
        .reset_index()
        .rename(columns={"index": "Indicador", 0: "Promedio"})
    )

    # Redondear y ordenar
    promedios["Promedio"] = promedios["Promedio"].round(4)
    promedios = promedios.sort_values(by="Promedio", ascending=False)

    # Calcular el peso relativo (suma total = 100%)
    total = promedios["Promedio"].sum()
    promedios["Peso (%)"] = (promedios["Promedio"] / total * 100).round(2)

    return promedios
