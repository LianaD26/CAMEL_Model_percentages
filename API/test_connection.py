#!/usr/bin/env python
"""
Script de prueba para verificar conexión a PostgreSQL Neon
"""
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Agregar la carpeta API al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.camel import Camel
from app.models.cooperativa import Cooperativa
from app.models.registro import Registro
from app.models.indicador import Indicador

def test_connection():
    """Prueba la conexión a Neon"""
    try:
        db = SessionLocal()
        
        # Contar registros en cada tabla
        camel_count = db.query(Camel).count()
        coop_count = db.query(Cooperativa).count()
        record_count = db.query(Registro).count()
        indicator_count = db.query(Indicador).count()
        
        print("CONEXIÓN EXITOSA A NEON")
        print(f"\nRegistros en base de datos:")
        print(f"  - Camel Levels: {camel_count}")
        print(f"  - Cooperativas: {coop_count}")
        print(f"  - Registros: {record_count}")
        print(f"  - Indicadores: {indicator_count}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"ERROR DE CONEXIÓN: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
