from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_4QZSj3pVxKWl@ep-wandering-hat-axmcoak1-pooler.c-4.us-east-2.aws.neon.tech:5432/neondb?sslmode=require")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Verificar cooperativas
        print("Primeras 5 cooperativas:")
        result = conn.execute(text("SELECT DISTINCT name FROM cooperative LIMIT 5"))
        for row in result:
            print(f"  - {row[0]}")
        
        # Verificar si existe nuestra cooperativa
        result = conn.execute(text("SELECT COUNT(*) FROM cooperative WHERE name = 'CAJA COOPERATIVA CREDICOOP'"))
        count = result.scalar()
        print(f"\n✅ Cooperativa 'CAJA COOPERATIVA CREDICOOP' existe: {count} registro(s)")
        
        # Verificar años
        result = conn.execute(text("SELECT DISTINCT year FROM camel_record ORDER BY year"))
        years = [row[0] for row in result]
        print(f"\nAños disponibles: {years}")
        
        # Verificar registros para esa cooperativa y año
        query = text("""
            SELECT COUNT(*) FROM camel_record cr
            JOIN cooperative c ON cr.id_cooperative = c.id_cooperative
            WHERE c.name = 'CAJA COOPERATIVA CREDICOOP' AND cr.year = 2021
        """)
        result = conn.execute(query)
        count = result.scalar()
        print(f"\n✅ Registros para CAJA COOPERATIVA CREDICOOP en 2021: {count}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
