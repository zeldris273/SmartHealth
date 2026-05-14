from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT current_database();"))
    print("Connected to:", result.scalar())