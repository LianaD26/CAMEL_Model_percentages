import pandas as pd
import os

# Obtener la ruta absoluta del archivo
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, 'Datos_2013_2025_cooperativas.csv')

data_raw = pd.read_csv(file_path)

def populate_table_cooperative(data:pd.DataFrame, columns_drops:list) -> list:
    """Extrae nombres de cooperativas del dataframe"""
    cooperatives = data.columns.drop(columns_drops).tolist()
    return cooperatives


def populate_camel_records(cursor, conn, csv_file_path: str) -> dict:
    """
    Llena la tabla camel_record desde un CSV usando COPY (muy rápido)
    
    Parámetros:
        cursor: cursor de la BD
        conn: conexión a la BD
        csv_file_path: ruta al CSV con registros CAMEL
    
    Retorna:
        dict: estadísticas de la inserción
    """
    
    print("\n" + "=" * 70)
    print("LLENANDO TABLA camel_record")
    print("=" * 70)
    
    # 1. Leer CSV
    print("\n1. Leyendo CSV...")
    df = pd.read_csv(csv_file_path)
    print(f"   ✓ CSV leído: {len(df)} registros")
    
    # 2. Obtener mapeos de la BD
    print("\n2. Obteniendo mapeos de la BD...")
    
    # Mapeo de indicadores
    cursor.execute("SELECT id_indicator, name FROM camel_indicator")
    indicator_map = {name: id_ind for id_ind, name in cursor.fetchall()}
    print(f"   ✓ {len(indicator_map)} indicadores mapeados")
    
    # Mapeo de cooperativas
    cursor.execute("SELECT id_cooperative, name FROM cooperative")
    cooperative_map = {name: id_coop for id_coop, name in cursor.fetchall()}
    print(f"   ✓ {len(cooperative_map)} cooperativas mapeadas")
    
    # 3. Transformar dataframe
    print("\n3. Transformando datos...")
    
    df_transformed = df.copy()
    
    # Renombrar columnas
    df_transformed = df_transformed.rename(columns={
        'ano': 'year',
        'mes': 'month',
        'ID_indicador': 'indicator_name',
        'ID_cooperativa': 'cooperative_name',
        'valor': 'value'
    })
    
    # Mapear nombres a IDs
    print("   Mapeando indicadores...")
    df_transformed['id_indicator'] = df_transformed['indicator_name'].map(indicator_map)
    
    print("   Mapeando cooperativas...")
    df_transformed['id_cooperative'] = df_transformed['cooperative_name'].map(cooperative_map)
    
    # Verificar valores no mapeados
    missing_indicators = df_transformed[df_transformed['id_indicator'].isna()]
    missing_cooperatives = df_transformed[df_transformed['id_cooperative'].isna()]
    
    stats = {
        'total_registros': len(df),
        'missing_indicators': len(missing_indicators),
        'missing_cooperatives': len(missing_cooperatives),
        'registros_insertados': 0,
        'error': None
    }
    
    if len(missing_indicators) > 0:
        print(f"\n   ⚠️  Indicadores no encontrados ({len(missing_indicators)} registros):")
        print(f"      {missing_indicators['indicator_name'].unique().tolist()}")
        df_transformed = df_transformed[df_transformed['id_indicator'].notna()]
    
    if len(missing_cooperatives) > 0:
        print(f"\n   ⚠️  Cooperativas no encontradas ({len(missing_cooperatives)} registros):")
        print(f"      {missing_cooperatives['cooperative_name'].unique().tolist()}")
        df_transformed = df_transformed[df_transformed['id_cooperative'].notna()]
    
    # Seleccionar columnas necesarias
    df_insert = df_transformed[['id_indicator', 'id_cooperative', 'year', 'month', 'value']]
    
    # Convertir IDs a integers y value a float
    df_insert['id_indicator'] = df_insert['id_indicator'].astype(int)
    df_insert['id_cooperative'] = df_insert['id_cooperative'].astype(int)
    df_insert['year'] = df_insert['year'].astype(int)
    df_insert['month'] = df_insert['month'].astype(int)
    df_insert['value'] = df_insert['value'].astype(float)
    
    # Convertir a tuplas
    records = [tuple(row) for row in df_insert.values]
    print(f"   ✓ {len(records)} registros listos para insertar")
    
    # 4. Insertar usando COPY (método rápido para PostgreSQL)
    print(f"\n4. Insertando registros con COPY (método rápido)...")
    
    try:
        # Preparar datos en formato CSV para COPY
        from io import StringIO
        
        csv_buffer = StringIO()
        for record in records:
            # Convertir explícitamente a int para id_indicator e id_cooperative
            id_indicator = int(record[0])
            id_cooperative = int(record[1])
            year = int(record[2])
            month = int(record[3])
            value = record[4]
            
            # Format: id_indicator|id_cooperative|year|month|value
            csv_buffer.write(f"{id_indicator}\t{id_cooperative}\t{year}\t{month}\t{value}\n")
        
        csv_buffer.seek(0)
        
        # Usar COPY para insertar rápidamente
        print("   Ejecutando COPY...")
        cursor.copy_from(
            csv_buffer,
            'camel_record',
            columns=('id_indicator', 'id_cooperative', 'year', 'month', 'value')
        )
        conn.commit()
        
        registros_insertados = len(records)
        stats['registros_insertados'] = registros_insertados
        print(f"   ✓ {registros_insertados} registros insertados exitosamente con COPY")
        
    except Exception as e:
        print(f"   ✗ Error al insertar con COPY: {e}")
        conn.rollback()
        stats['error'] = str(e)
    
    # 5. Verificación
    print("\n5. Verificación...")
    try:
        cursor.execute("SELECT COUNT(*) FROM camel_record")
        total_records = cursor.fetchone()[0]
        print(f"   ✓ Total de registros en camel_record: {total_records}")
    except Exception as e:
        print(f"   ✗ Error en verificación: {e}")
    
    print("\n" + "=" * 70)
    print("✓ PROCESO COMPLETADO")
    print("=" * 70)
    
    return stats


def populate_cooperatives(cursor, conn, csv_file_path: str ) -> dict:
    cooperatives_df = pd.read_csv(csv_file_path)
    cooperatives_uniques_df=cooperatives_df[['ID_cooperativa','categoria']].drop_duplicates()
    cooperatives = [tuple(row) for row in cooperatives_uniques_df.values]

    stats = {
        'total_cooperatives': len(cooperatives),
        'inserted_cooperatives': 0,
        'error': None
    }
    
    try:
        # Preparar la consulta SQL para insertar cooperativas
        insert_query = "INSERT INTO cooperative (name, category) VALUES (%s, %s)"
        
        # Ejecutar la inserción en lotes
        cursor.executemany(insert_query, cooperatives)
        conn.commit()
        
        stats['inserted_cooperatives'] = cursor.rowcount
        
    except Exception as e:
        conn.rollback()
        stats['error'] = str(e)
    
    return stats