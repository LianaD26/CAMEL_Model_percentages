#!/usr/bin/env python3
"""
Script para verificar la conexión a la API y que la base de datos está accesible
"""
import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_connection():
    """Prueba la conexión básica a la API"""
    print("=" * 60)
    print("🔍 VERIFICANDO CONEXIÓN A LA API")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_URL}/docs")
        if response.status_code == 200:
            print("✅ API disponible en http://localhost:8000")
            print("📄 Swagger UI: http://localhost:8000/docs")
        else:
            print(f"❌ API respondió con código {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ No se pudo conectar a la API: {e}")
        print("   Asegúrate de que FastAPI está ejecutándose: python API/app/main.py")
        return False
    
    return True


def test_endpoints():
    """Prueba todos los endpoints principales"""
    print("\n" + "=" * 60)
    print("🧪 PROBANDO ENDPOINTS")
    print("=" * 60)
    
    endpoints = [
        ("GET /anos/", f"{API_URL}/anos/"),
        ("GET /cooperativas/", f"{API_URL}/cooperativas/"),
        ("GET /indicadores/", f"{API_URL}/indicadores/"),
        ("GET /camels/", f"{API_URL}/camels/"),
    ]
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ {name:30} - {len(data)} registros")
                else:
                    print(f"✅ {name:30} - OK")
            else:
                print(f"❌ {name:30} - Código {response.status_code}")
        except requests.exceptions.Timeout:
            print(f"⏱️  {name:30} - Timeout (tarda demasiado)")
        except Exception as e:
            print(f"❌ {name:30} - Error: {e}")


def test_database_query():
    """Prueba una consulta a la base de datos"""
    print("\n" + "=" * 60)
    print("🗄️  PROBANDO CONSULTA A BASE DE DATOS")
    print("=" * 60)
    
    try:
        # Obtener cooperativas
        print("\n1️⃣  Obteniendo lista de cooperativas...")
        coop_response = requests.get(f"{API_URL}/cooperativas/", timeout=5)
        if coop_response.status_code == 200:
            cooperativas = coop_response.json()
            if cooperativas:
                coop_name = cooperativas[0]["name"]
                print(f"   ✅ Cooperativa encontrada: {coop_name}")
                
                # Obtener años
                print("\n2️⃣  Obteniendo años disponibles...")
                years_response = requests.get(f"{API_URL}/anos/", timeout=5)
                if years_response.status_code == 200:
                    years_data = years_response.json()
                    # El endpoint retorna {anos: [...], total: N}
                    years = years_data.get("anos", []) if isinstance(years_data, dict) else years_data
                    if years:
                        year = years[0]
                        print(f"   ✅ Años encontrados: {years}")
                        
                        # Hacer consulta completa
                        print(f"\n3️⃣  Consultando registros de {coop_name} - {year}...")
                        query_url = f"{API_URL}/registros/completo/?cooperativa_nombre={coop_name}&year={year}"
                        query_response = requests.get(query_url, timeout=10)
                        
                        if query_response.status_code == 200:
                            records = query_response.json()
                            print(f"   ✅ {len(records)} registros encontrados")
                            
                            # Mostrar estructura de un registro
                            if records:
                                print("\n   Estructura del registro:")
                                sample = records[0]
                                for key, value in sample.items():
                                    print(f"      - {key}: {value}")
                            
                            return True
                        else:
                            print(f"   ❌ Error en consulta: {query_response.status_code}")
                            print(f"   Respuesta: {query_response.text}")
                    else:
                        print("   ❌ No hay años disponibles")
                else:
                    print(f"   ❌ Error obteniendo años: {years_response.status_code}")
            else:
                print("   ❌ No hay cooperativas en la base de datos")
        else:
            print(f"   ❌ Error obteniendo cooperativas: {coop_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error en prueba de base de datos: {e}")
    
    return False


def main():
    """Ejecuta todas las pruebas"""
    if not test_connection():
        print("\n❌ No se pudo conectar a la API. Por favor, verifica que esté ejecutándose.")
        sys.exit(1)
    
    test_endpoints()
    success = test_database_query()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TODAS LAS PRUEBAS PASARON - La API está funcionando correctamente")
        print("   Puedes usar el frontend con confianza")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - Verifica la configuración")
    print("=" * 60)


if __name__ == "__main__":
    main()
