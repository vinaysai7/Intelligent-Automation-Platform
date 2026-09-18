from database.connection import get_connection


class RobotHistoryRepository:

    def add_event(
        self,
        robot_id,
        operation,
        status,
        x=None,
        y=None,
        z=None,
        message=None
    ):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                INSERT INTO robot_history (
                    robot_id,
                    operation,
                    status,
                    x,
                    y,
                    z,
                    message
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """

            cursor.execute(
                query,
                (
                    robot_id,
                    operation,
                    status,
                    x,
                    y,
                    z,
                    message
                )
            )

            connection.commit()

        finally:
            connection.close()

    def get_history(self, robot_id):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                SELECT
                    robot_id,
                    operation,
                    status,
                    x,
                    y,
                    z,
                    message,
                    created_at
                FROM robot_history
                WHERE robot_id = %s
                ORDER BY id DESC;
            """

            cursor.execute(query, (robot_id,))
            rows = cursor.fetchall()

            history = []

            for row in rows:
                history.append({
                    "robot_id": row[0],
                    "operation": row[1],
                    "status": row[2],
                    "position": [row[3], row[4], row[5]],
                    "message": row[6],
                    "created_at": row[7]
                })

            return history

        finally:
            connection.close()