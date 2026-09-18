from database.connection import get_connection

CREATE_JOBS_TABLE = """
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER UNIQUE NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    attempts INTEGER DEFAULT 0,
    execution_time FLOAT DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_ROBOTS_TABLE = """
CREATE TABLE IF NOT EXISTS robots (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER UNIQUE NOT NULL,
    robot_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    x FLOAT DEFAULT 0,
    y FLOAT DEFAULT 0,
    z FLOAT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_ROBOT_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS robot_history (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER NOT NULL,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    x FLOAT,
    y FLOAT,
    z FLOAT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def initialize_database():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(CREATE_JOBS_TABLE)
        cursor.execute(CREATE_ROBOTS_TABLE)
        cursor.execute(CREATE_ROBOT_HISTORY_TABLE)

        connection.commit()

        print("Jobs, robots, and robot history tables created successfully.")

        cursor.close()

    finally:
        connection.close()

if __name__ == "__main__":
    initialize_database()