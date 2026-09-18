from database.connection import get_connection


class RobotRepository:

    def create_robot(self, robot_id, robot_name, status="IDLE"):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                INSERT INTO robots (
                    robot_id,
                    robot_name,
                    status,
                    x,
                    y,
                    z
                )
                VALUES (%s, %s, %s, 0, 0, 0)
                RETURNING id;
            """

            cursor.execute(
                query,
                (robot_id, robot_name, status)
            )

            database_id = cursor.fetchone()[0]
            connection.commit()

            return database_id

        finally:
            connection.close()

    def get_robot(self, robot_id):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                SELECT
                    robot_id,
                    robot_name,
                    status,
                    x,
                    y,
                    z,
                    updated_at
                FROM robots
                WHERE robot_id = %s;
            """

            cursor.execute(query, (robot_id,))
            robot = cursor.fetchone()

            if robot is None:
                return None

            return {
                "robot_id": robot[0],
                "robot_name": robot[1],
                "status": robot[2],
                "position": [robot[3], robot[4], robot[5]],
                "updated_at": robot[6]
            }

        finally:
            connection.close()

    def update_robot(self, robot_id, status, x, y, z):
        connection = get_connection()

        try:
            cursor = connection.cursor()

            query = """
                UPDATE robots
                SET
                    status = %s,
                    x = %s,
                    y = %s,
                    z = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE robot_id = %s;
            """

            cursor.execute(
                query,
                (status, x, y, z, robot_id)
            )

            connection.commit()

        finally:
            connection.close()