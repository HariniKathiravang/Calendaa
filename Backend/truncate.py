import sqlite3
import time

def truncate_events():
    retries = 5
    for i in range(retries):
        try:
            conn = sqlite3.connect('calendaa.db', timeout=10)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM events')
            conn.commit()
            conn.close()
            print('Table events truncated successfully.')
            return
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e):
                print(f"Database locked, retrying {i+1}/{retries}...")
                time.sleep(2)
            else:
                raise e
    print("Failed to truncate events table due to database lock.")

if __name__ == "__main__":
    truncate_events()
