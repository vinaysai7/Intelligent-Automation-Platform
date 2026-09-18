from database.connection import get_connection


class MonitoringMetrics:

    def get_job_metrics(self):

        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                SELECT
                    COUNT(*) AS total_jobs,
                    COUNT(*) FILTER (
                        WHERE status = 'COMPLETED'
                    ) AS completed_jobs,
                    COUNT(*) FILTER (
                        WHERE status = 'FAILED'
                    ) AS failed_jobs,
                    COALESCE(SUM(attempts), 0) AS total_attempts,
                    COALESCE(AVG(execution_time), 0) AS average_execution_time
                FROM jobs;
            """

            cursor.execute(query)

            result = cursor.fetchone()

            return {
                "total_jobs": result[0],
                "completed_jobs": result[1],
                "failed_jobs": result[2],
                "total_attempts": result[3],
                "average_execution_time": round(
                    float(result[4]),
                    4
                )
            }

        finally:
            connection.close()