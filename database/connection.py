import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "automation_platform",
    "user": "postgres",
    "password": "bandela"
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)