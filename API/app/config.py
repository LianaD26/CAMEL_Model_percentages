import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL Neon Connection
# IMPORTANTE: Configura DATABASE_URL en el archivo .env
DATABASE_URL = os.getenv("DATABASE_URL")