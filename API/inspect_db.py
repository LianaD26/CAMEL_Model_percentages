#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para inspeccionar la estructura real de las tablas en Neon
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_table_structure(table_name):
    """Obtiene la estructura de una tabla"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Obtener columnas de la tabla
        cursor.execute(f"""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return columns
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    """Muestra la estructura de todas las tablas"""
    tables = ['camel_level', 'camel_indicator', 'cooperative', 'camel_record', 'superfin_indicator', 'superfin_record', 'cooperative_category']
    
    print("=" * 80)
    print("ESTRUCTURA DE TABLAS EN NEON")
    print("=" * 80)
    
    for table in tables:
        columns = get_table_structure(table)
        if columns:
            print(f"\n📋 Tabla: {table}")
            print("-" * 60)
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                print(f"  - {col['column_name']}: {col['data_type']} ({nullable})")
        else:
            print(f"\n⚠️ Tabla {table} no encontrada o error de conexión")

if __name__ == "__main__":
    main()
