import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Obtener credenciales de Neon
NEON_HOST = os.getenv("NEON_HOST")
NEON_USER = os.getenv("NEON_USER")
NEON_PASSWORD = os.getenv("NEON_PASSWORD")
NEON_DATABASE = os.getenv("NEON_DATABASE")
NEON_PORT = os.getenv("NEON_PORT", 5432)

def connect_to_neon():
    """Conectar a la base de datos Neon"""
    try:
        conn = psycopg2.connect(
            host=NEON_HOST,
            user=NEON_USER,
            password=NEON_PASSWORD,
            database=NEON_DATABASE,
            port=NEON_PORT,
            sslmode="require"  # Neon requiere SSL
        )
        print("✓ Conexión exitosa a Neon")
        return conn
    except Exception as e:
        print(f"✗ Error al conectar a Neon: {e}")
        return None

def read_sql_file(filepath):
    """Leer archivo SQL"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print(f"✓ Archivo SQL leído: {filepath}")
        return sql_content
    except Exception as e:
        print(f"✗ Error al leer archivo SQL: {e}")
        return None

def execute_sql(conn, sql_content):
    """Ejecutar SQL en Neon"""
    try:
        cursor = conn.cursor()
        
        # Dividir por punto y coma para ejecutar cada sentencia
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            print(f"\n[{i}/{len(statements)}] Ejecutando sentencia...")
            cursor.execute(statement)
            conn.commit()
            print(f"✓ Sentencia {i} ejecutada correctamente")
        
        cursor.close()
        print("\n✓ Todas las sentencias ejecutadas correctamente")
        return True
    except Exception as e:
        print(f"✗ Error al ejecutar SQL: {e}")
        conn.rollback()
        return False

def main():
    print("=" * 60)
    print("SETUP DE BASE DE DATOS NEON")
    print("=" * 60)
    
    # Validar credenciales
    if not all([NEON_HOST, NEON_USER, NEON_PASSWORD, NEON_DATABASE]):
        print("✗ Error: Falta configurar las credenciales en .env")
        print("Asegúrate de tener:")
        print("  - NEON_HOST")
        print("  - NEON_USER")
        print("  - NEON_PASSWORD")
        print("  - NEON_DATABASE")
        return
    
    # Conectar
    conn = connect_to_neon()
    if not conn:
        return
    
    # Leer SQL
    sql_file = os.path.join(os.path.dirname(__file__), "DB_structure.sql")
    sql_content = read_sql_file(sql_file)
    if not sql_content:
        conn.close()
        return
    
    # Ejecutar SQL
    success = execute_sql(conn, sql_content)
    
    # Cerrar conexión
    conn.close()
    
    print("\n" + "=" * 60)
    if success:
        print("✓ SETUP COMPLETADO CON ÉXITO")
    else:
        print("✗ SETUP FALLÓ")
    print("=" * 60)

if __name__ == "__main__":
    main()
