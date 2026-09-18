class CollisionDetector:

    def __init__(self, safety_distance=0.5):

        self.safety_distance = safety_distance


    def check_collision(self, robot_position, obstacles):

        for obstacle in obstacles:

            distance = self._calculate_distance(
                robot_position,
                obstacle
            )

            if distance < self.safety_distance:
                return {
                    "collision": True,
                    "message": "Obstacle detected too close to robot",
                    "distance": round(distance, 4)
                }

        return {
            "collision": False,
            "message": "Path is clear",
            "distance": None
        }


    def _calculate_distance(self, point_a, point_b):

        return (
            (point_a[0] - point_b[0]) ** 2 +
            (point_a[1] - point_b[1]) ** 2 +
            (point_a[2] - point_b[2]) ** 2
        ) ** 0.5