from database import engine
from sqlalchemy import text

def migrate():
    print("Starting PostgreSQL migration...")
    try:
        with engine.connect() as conn:
            # PostgreSQL requires a transaction for ALTER TABLE
            trans = conn.begin()
            try:
                columns = [
                    ("underlying_diseases", "TEXT"),
                    ("food_allergies", "TEXT"),
                    ("activity_level", "VARCHAR(50)"),
                    ("other_diseases", "VARCHAR(255)"),
                    ("other_allergies", "VARCHAR(255)"),
                ]
                
                for col_name, col_type in columns:
                    # In PostgreSQL, we check if column exists first to avoid errors
                    check_sql = text(f"SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='{col_name}'")
                    result = conn.execute(check_sql).fetchone()
                    
                    if result is None:
                        print(f"Adding column {col_name}...")
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    else:
                        print(f"Column {col_name} already exists.")
                
                trans.commit()
                print("Migration completed successfully.")
            except Exception as e:
                trans.rollback()
                print(f"Error during migration: {e}")
                raise e
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    migrate()