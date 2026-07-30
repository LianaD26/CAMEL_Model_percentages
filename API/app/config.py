import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL Neon Connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_4QZSj3pVxKWl@ep-wandering-hat-axmcoak1-pooler.c-4.us-east-2.aws.neon.tech:5432/neondb?sslmode=require"
)