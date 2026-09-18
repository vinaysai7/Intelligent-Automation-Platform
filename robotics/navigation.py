import math


class RobotNavigator:

    def calculate_distance(self, start, target):

        distance = math.sqrt(
            (target[0] - start[0]) ** 2 +
            (target[1] - start[1]) ** 2 +
            (target[2] - start[2]) ** 2
        )

        return round(distance, 4)


    def create_path(self, start, target, steps=10):

        path = []

        for i in range(steps + 1):

            ratio = i / steps

            x = start[0] + (target[0] - start[0]) * ratio
            y = start[1] + (target[1] - start[1]) * ratio
            z = start[2] + (target[2] - start[2]) * ratio

            path.append([
                round(x, 4),
                round(y, 4),
                round(z, 4)
            ])

        return path