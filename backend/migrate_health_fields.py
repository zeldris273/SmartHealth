import sqlite3

def migrate():
    db_path = 'smarthealth.db'
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        columns = [
            ("underlying_diseases", "TEXT"),
            ("food_allergies", "TEXT"),
            ("activity_level", "VARCHAR(50)"),
            ("other_diseases", "VARCHAR(255)"),
            ("other_allergies", "VARCHAR(255)"),
        ]
        
        for col_name, col_type in columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added column {col_name}")
            except sqlite3.OperationalError as e:
                print(f"Column {col_name} may already exist: {e}")
        
        conn.commit()
        conn.close()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    migrate()