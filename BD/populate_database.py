import pandas as pd
import psycopg2
from dotenv import load_dotenv
import os
from populate_functions import populate_table_cooperative, populate_camel_records,populate_cooperatives

# Obtener la ruta absoluta del archivo CSV
current_dir = os.path.dirname(os.path.abspath(__file__))
#csv_path = os.path.join(current_dir, 'Datos_2013_2025_cooperativas.csv')
camel_csv_path = os.path.join(current_dir, 'Registros_CAMEL_sin_solvencia_categorizados.csv')
#data = pd.read_csv(csv_path)

load_dotenv(dotenv_path=os.path.join(current_dir, '.env'))

# Conectar
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

# llenar camel level 

Camel_levels= ['Capital', 'Assets', 'Managerial', 'Earnings', 'Liquidity']

for levels in Camel_levels:
    cursor.execute("INSERT INTO camel_level (name) VALUES (%s) ON CONFLICT DO NOTHING ", 
                (levels,)
                )
conn.commit()

# llenar coperativas 

stats_cooperatives = populate_cooperatives(cursor, conn, camel_csv_path)

# llenar camel indicator 

indicators_data = [
    (1,'Quebranto Patrimonial'),
    (1,'Relación entre Aportes sociales mínimos no reducibles y Capital Social'),
    (1,'Relación entre el Capital Institucional y el Activo Total'),
    (2,'Indicador de calidad por riesgo'),
    (2,'Indicador de calidad por riesgo con castigos'),
    (2,'Indicador de Cobertura de la Cartera Total en Riesgo'),
    (2,'Activo Productivo'),
    (2,'Indicador de Cobertura individual de la cartera improductiva para la cartera en Riesgo'),
    (3,'Indicador de Margen Financiero de Operación'),
    (3,'Indicador de Margen Operacional'),
    (3,'Indicador de relación entre las obligaciones financieras y el pasivo total'),
    (3,'Estructura de Balance'),
    (4,'Indicador de rentabilidad sobre recursos propios - ROE'),
    (4,'Indicador de margen neto'),
    (4,'Indicador de rentabilidad sobre el capital invertido - ROIC'),
    (5,'Activos líquidos ampliados / depósitos a corto plazo')
]

cursor.executemany(
    "INSERT INTO camel_indicator (id_camel, name) VALUES (%s, %s) ON CONFLICT DO NOTHING", 
    indicators_data
)
conn.commit()

# llenar camel_record desde CSV
stats = populate_camel_records(cursor, conn, camel_csv_path)

cursor.close()
conn.close()

