# services/cargar_datos_pca.py
import mysql.connector
import pandas as pd
import os
from dotenv import load_dotenv

def cargar_datos():
    """Carga y prepara los datos desde la base MySQL para el análisis PCA."""
    load_dotenv("/home/lia/Documentos/repos/CAMEL_Model_Percentages/CAMEL_Model_percentages/frontend/.env")
    PASSWORD = os.getenv("DB_PASSWORD")

    conn = mysql.connector.connect(
        host="camel-model25-limadio-5956.j.aivencloud.com",
        port=16156,
        user="avnadmin",
        password=PASSWORD,
        ssl_ca="/home/lia/aiven-mysql/ca.pem",
        database="camel_model"
    )

    query = """
        SELECT 
            r.ID_indicador,
            i.nombre AS indicador_nombre,
            r.ID_cooperativa,
            c.nombre AS cooperativa_nombre,
            r.ano,
            r.mes,
            r.valor
        FROM registro r
        JOIN indicador i ON r.ID_indicador = i.ID_indicador
        JOIN cooperativa c ON r.ID_cooperativa = c.ID_cooperativa
        ORDER BY r.ano, r.mes;
    """

    df = pd.read_sql(query, conn)
    conn.close()

    df_pivot = df.pivot_table(
        index=["ano", "mes", "ID_cooperativa", "cooperativa_nombre"],
        columns="indicador_nombre",
        values="valor"
    ).reset_index()

    df_pivot["Periodo"] = pd.to_datetime(
        df_pivot["ano"].astype(str) + "-" + df_pivot["mes"].astype(str) + "-01"
    ).dt.to_period("M")

    return df_pivot