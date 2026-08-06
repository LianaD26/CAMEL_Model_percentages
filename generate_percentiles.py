import sys
sys.path.insert(0, 'API')
from app.main import app
from app.database import SessionLocal
from app.services.percentiles import generar_percentiles_completo
from sqlalchemy.orm import Session

# Obtener sesión
db = SessionLocal()
try:
    print('🔄 Generando percentiles...')
    resultado = generar_percentiles_completo(db)
    print('✅ Percentiles generados exitosamente')
    fecha = resultado.get('fecha_calculo')
    print(f'Timestamp: {fecha}')
    if 'percentiles_generales' in resultado:
        num_indicadores = len(resultado['percentiles_generales'].get('percentiles', {}))
        print(f'Percentiles generales: {num_indicadores} indicadores')
    if 'percentiles_por_categoria' in resultado:
        categorias = list(resultado['percentiles_por_categoria'].keys())
        print(f'Categorías: {categorias}')
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
finally:
    db.close()
