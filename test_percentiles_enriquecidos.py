import sys
sys.path.insert(0, 'API')
from app.database import SessionLocal
from app.services.percentiles import (
    cargar_percentiles_desde_archivo,
    enriquecer_percentiles_con_metadata
)

db = SessionLocal()
try:
    print('🔄 Cargando percentiles...')
    percentiles = cargar_percentiles_desde_archivo()
    
    print('✅ Percentiles cargados')
    print(f"Estructura: {list(percentiles.keys())}")
    
    print('\n🔄 Enriqueciendo con metadata...')
    percentiles_enriquecidos = enriquecer_percentiles_con_metadata(db, percentiles)
    
    print('✅ Percentiles enriquecidos')
    
    # Verificar estructura enriquecida
    if 'percentiles_generales' in percentiles_enriquecidos:
        pct_gen = percentiles_enriquecidos['percentiles_generales']
        pct_dict = pct_gen.get('percentiles', {})
        if pct_dict:
            primer_ind = list(pct_dict.items())[0]
            print(f"\nEstructura enriquecida (General):")
            print(f"  Primer indicador ID: {primer_ind[0]}")
            print(f"  Claves: {list(primer_ind[1].keys())}")
            
    if 'percentiles_por_categoria' in percentiles_enriquecidos:
        categorias = list(percentiles_enriquecidos['percentiles_por_categoria'].keys())
        print(f"\n✅ Categorías enriquecidas: {categorias}")
        
        # Verificar una categoría
        primer_cat = categorias[0] if categorias else None
        if primer_cat:
            cat_data = percentiles_enriquecidos['percentiles_por_categoria'][primer_cat]
            pct_dict = cat_data.get('percentiles', {})
            if pct_dict:
                primer_ind = list(pct_dict.items())[0]
                print(f"\nEstructura enriquecida ({primer_cat}):")
                print(f"  Primer indicador ID: {primer_ind[0]}")
                print(f"  Claves: {list(primer_ind[1].keys())}")
        
    print("\n✅ Enriquecimiento completado correctamente")
    
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
finally:
    db.close()
