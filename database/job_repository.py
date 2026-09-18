from database.connection import get_connection


class JobRepository:

    def create_job(
        self,
        job_id,
        job_name,
        priority,
        status="CREATED"
    ):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                INSERT INTO jobs (
                    job_id,
                    job_name,
                    priority,
                    status
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """

            cursor.execute(
                query,
                (
                    job_id,
                    job_name,
                    priority,
                    status
                )
            )

            database_id = cursor.fetchone()[0]

            connection.commit()

            return database_id

        finally:
            connection.close()


    def update_job(
        self,
        job_id,
        status,
        attempts,
        execution_time,
        message
    ):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                UPDATE jobs
                SET
                    status = %s,
                    attempts = %s,
                    execution_time = %s,
                    message = %s
                WHERE job_id = %s;
            """

            cursor.execute(
                query,
                (
                    status,
                    attempts,
                    execution_time,
                    message,
                    job_id
                )
            )

            connection.commit()

        finally:
            connection.close()


    def get_execution_times(self):

        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                SELECT execution_time
                FROM jobs
                WHERE execution_time > 0
                ORDER BY id;
            """

            cursor.execute(query)

            rows = cursor.fetchall()

            return [row[0] for row in rows]

        finally:
            connection.close()