import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv


def cargar_resultados_camel_desde_xlsx():
    """
    Lee el archivo resultado_camel.xlsx y carga los resultados CAMEL a la tabla camel_result.
    Estructura del Excel:
    - ID_cooperativa: nombre de la cooperativa
    - CAMEL_score: valor del CAMEL para la cooperativa
    - categoria: categoría de la cooperativa
    """
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    excel_path = os.path.join(current_dir, "resultado_camel.xlsx")
    load_dotenv(dotenv_path=os.path.join(current_dir, ".env"))

    # Verificar que el archivo existe
    if not os.path.exists(excel_path):
        print(f"❌ Error: Archivo {excel_path} no encontrado")
        return

    # Leer el Excel
    print("📁 Leyendo archivo resultado_camel.xlsx...")
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print(f"❌ Error al leer Excel: {e}")
        return

    print(f"✓ Se leyeron {len(df)} registros del Excel")
    print(f"✓ Columnas: {df.columns.tolist()}")

    # Validar que tenga las columnas necesarias
    required_columns = ["ID_cooperativa", "CAMEL_score", "categoria"]
    if not all(col in df.columns for col in required_columns):
        print(f"❌ Error: El Excel debe tener las columnas: {required_columns}")
        return

    # Conectar a Neon
    print("\n🔗 Conectando a Neon...")
    try:
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
        print("✓ Conexión establecida")
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        return

    # Mapeo de nombres de cooperativa -> id_cooperative
    print("\n📋 Obteniendo mapeo de cooperativas...")
    try:
        cursor.execute("SELECT id_cooperative, name FROM cooperative")
        coop_map = {row[1]: row[0] for row in cursor.fetchall()}
        print(f"✓ Se encontraron {len(coop_map)} cooperativas en la BD")
    except Exception as e:
        print(f"❌ Error al obtener cooperativas: {e}")
        cursor.close()
        conn.close()
        return

    # Procesar registros
    print("\n⚙️  Procesando registros...")
    registros_insertados = 0
    registros_fallidos = 0
    registros_duplicados = 0

    for index, row in df.iterrows():
        nombre_coop = row["ID_cooperativa"]
        camel_score = row["CAMEL_score"]
        categoria = row["categoria"]

        # Obtener ID de la cooperativa
        id_coop = coop_map.get(nombre_coop)
        if not id_coop:
            print(f"⚠️  Fila {index + 2}: Cooperativa '{nombre_coop}' no encontrada en BD")
            registros_fallidos += 1
            continue

        # Validar datos
        try:
            camel_score = float(camel_score)
        except (ValueError, TypeError):
            print(f"⚠️  Fila {index + 2}: CAMEL_score inválido: {camel_score}")
            registros_fallidos += 1
            continue

        # Insertar o actualizar (ON CONFLICT)
        try:
            cursor.execute(
                """
                INSERT INTO camel_result (id_cooperative, category, result)
                VALUES (%s, %s, %s)
                ON CONFLICT (id_cooperative, category) DO UPDATE
                SET result = EXCLUDED.result
                """
                ,
                (id_coop, categoria, camel_score)
            )
            registros_insertados += 1
        except psycopg2.IntegrityError:
            # Ya existe
            try:
                cursor.execute(
                    """
                    UPDATE camel_result
                    SET result = %s
                    WHERE id_cooperative = %s AND category = %s
                    """,
                    (camel_score, id_coop, categoria)
                )
                registros_duplicados += 1
            except Exception as e:
                print(f"⚠️  Fila {index + 2}: Error al actualizar: {e}")
                registros_fallidos += 1
        except Exception as e:
            print(f"⚠️  Fila {index + 2}: Error al insertar: {e}")
            registros_fallidos += 1

    # Confirmar cambios
    try:
        conn.commit()
        print(f"\n✓ Cambios guardados en la BD")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al guardar cambios: {e}")
        cursor.close()
        conn.close()
        return

    # Resumen
    print(f"\n📊 Resumen:")
    print(f"  ✓ Registros insertados: {registros_insertados}")
    print(f"  ✓ Registros actualizados: {registros_duplicados}")
    print(f"  ❌ Registros fallidos: {registros_fallidos}")
    print(f"  📈 Total procesados: {len(df)}")

    # Verificar registros en BD
    try:
        cursor.execute("SELECT COUNT(*) FROM camel_result")
        total_en_bd = cursor.fetchone()[0]
        print(f"\n✓ Total de registros en camel_result: {total_en_bd}")
    except Exception as e:
        print(f"⚠️  Error al contar registros: {e}")

    cursor.close()
    conn.close()
    print("\n✓ Proceso completado")


if __name__ == "__main__":
    cargar_resultados_camel_desde_xlsx()
