"""Pure-Python robotics simulation.

No PyBullet or native/C++ dependencies are required.
"""

import math


class RobotSimulation:
    def __init__(self):
        self.position = [0.0, 0.0, 0.0]
        self.obstacles = [
            {"name": "Obstacle-1", "position": [2.0, 2.0, 2.0], "radius": 0.5},
            {"name": "Obstacle-2", "position": [4.0, 1.0, 1.0], "radius": 0.5},
        ]
        self.safety_distance = 0.5

    @staticmethod
    def _distance(a, b):
        return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))

    def _collision(self, target):
        for obstacle in self.obstacles:
            distance = self._distance(target, obstacle["position"])
            if distance <= obstacle["radius"] + self.safety_distance:
                return {
                    "collision": True,
                    "obstacle": obstacle["name"],
                    "distance": round(distance, 3),
                }
        return {"collision": False, "obstacle": None, "distance": None}

    def status(self):
        return {
            "simulation": "Running",
            "robot_position": self.position,
            "obstacles": self.obstacles,
            "safety_distance": self.safety_distance,
        }

    def move_to(self, x, y, z):
        target = [float(x), float(y), float(z)]
        collision = self._collision(target)
        distance = self._distance(self.position, target)

        if collision["collision"]:
            return {
                "status": "MOVEMENT_REJECTED",
                "robot_position": self.position,
                "target_position": target,
                "distance": round(distance, 3),
                "collision": collision,
                "message": "Movement rejected: obstacle detected",
            }

        old_position = self.position.copy()
        self.position = target

        return {
            "status": "MOVED",
            "previous_position": old_position,
            "robot_position": self.position,
            "target_position": target,
            "distance": round(distance, 3),
            "collision": collision,
            "message": "Simulation robot moved successfully",
        }
