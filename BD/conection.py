import mysql.connector
from data import Data 
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="/home/lia/Documentos/repos/CAMEL_Model_Percentages/CAMEL_Model_percentages/frontend/.env")
PASSWORD = os.getenv("DB_PASSWORD")
conn = mysql.connector.connect(
    host="camel-model25-limadio-5956.j.aivencloud.com",
    port=16156,
    user="avnadmin",
    password= PASSWORD,
    ssl_ca="/home/lia/aiven-mysql/ca.pem",
    database="camel_model" 
)

cursor = conn.cursor()
tables = [
    """
    CREATE TABLE IF NOT EXISTS camel (
        ID_camel INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS indicador (
        ID_indicador INT AUTO_INCREMENT PRIMARY KEY,
        ID_camel INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        UNIQUE (ID_camel, nombre),
        FOREIGN KEY (ID_camel) REFERENCES camel(ID_camel)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cooperativa (
        ID_cooperativa INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS registro (
        ID_registro INT AUTO_INCREMENT PRIMARY KEY,
        ID_indicador INT,
        ID_cooperativa INT,
        ano INT,
        mes INT,
        valor DECIMAL(20,10),
        FOREIGN KEY (ID_indicador) REFERENCES indicador(ID_indicador),
        FOREIGN KEY (ID_cooperativa) REFERENCES cooperativa(ID_cooperativa),
        UNIQUE (ID_indicador, ID_cooperativa, ano, mes) -- evita duplicados
    );
    """
]

for query in tables:
    cursor.execute(query)


Data.create_camel(cursor, conn)
Data.create_indicator(cursor, conn)
Data.create_cooperativas(cursor, conn)
Data.create_registros(cursor, conn)

cursor.close()
conn.close()
