# services/promedios.py
import pandas as pd
from API.app.services.cargar_datos_pca import cargar_datos

def promedio_indicadores():
    """
    Calcula el promedio de cada indicador considerando todos los años,
    meses y cooperativas disponibles en la base de datos.
    """
    df = cargar_datos()

    # Identificar columnas numéricas de indicadores
    indicadores = [col for col in df.columns if col not in [
        "ano", "mes", "ID_cooperativa", "cooperativa_nombre", "Periodo"
    ]]

    # Calcular el promedio global de cada indicador
    promedios = (
        df[indicadores]
        .mean()
        .reset_index()
        .rename(columns={"index": "Indicador", 0: "Promedio"})
    )

    # Redondear a 4 decimales y ordenar
    promedios["Promedio"] = promedios["Promedio"].round(4)
    promedios = promedios.sort_values(by="Promedio", ascending=False)

    return promedios
