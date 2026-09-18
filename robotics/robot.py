class Robot:

    def __init__(self, robot_id, name):

        self.robot_id = robot_id
        self.name = name
        self.status = "IDLE"
        self.position = [0, 0, 0]

    def move_to(self, x, y, z):

        self.status = "MOVING"

        self.position = [x, y, z]

        self.status = "IDLE"

        return {
            "robot_id": self.robot_id,
            "robot_name": self.name,
            "status": self.status,
            "position": self.position,
            "message": "Robot moved successfully"
        }

    def inspect(self):

        self.status = "INSPECTING"

        result = {
            "robot_id": self.robot_id,
            "robot_name": self.name,
            "status": "INSPECTION_COMPLETED",
            "position": self.position,
            "message": "Robot inspection completed"
        }

        return result