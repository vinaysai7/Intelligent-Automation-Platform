from robotics.robot import Robot
from robotics.navigation import RobotNavigator
from robotics.collision import CollisionDetector


def test_robot_movement():
    robot = Robot(robot_id=1, name="Inspection Robot")

    result = robot.move_to(1, 1, 1)

    assert result["status"] == "IDLE"
    assert result["position"] == [1, 1, 1]


def test_robot_inspection():
    robot = Robot(robot_id=2, name="Quality Robot")

    robot.move_to(1, 1, 1)

    result = robot.inspect()

    assert result["status"] == "INSPECTION_COMPLETED"
    assert result["position"] == [1, 1, 1]


def test_navigation():
    navigator = RobotNavigator()

    distance = navigator.calculate_distance(
        [0, 0, 0],
        [1, 1, 1]
    )

    assert distance == 1.7321

    path = navigator.create_path(
        [0, 0, 0],
        [1, 1, 1],
        steps=10
    )

    assert len(path) == 11
    assert path[0] == [0, 0, 0]
    assert path[-1] == [1, 1, 1]


def test_collision_detection():
    detector = CollisionDetector(safety_distance=0.5)

    collision = detector.check_collision(
        [0, 0, 0],
        [[0.2, 0, 0]]
    )

    assert collision["collision"] is True
    assert collision["distance"] == 0.2


def test_clear_path():
    detector = CollisionDetector(safety_distance=0.5)

    result = detector.check_collision(
        [0, 0, 0],
        [[2, 2, 2]]
    )

    assert result["collision"] is False


def test_collision_preserves_robot_position():
    detector = CollisionDetector(safety_distance=0.5)

    current_position = [5, 3, 2]
    requested_position = [0, 0, 0]

    result = detector.check_collision(
        requested_position,
        [[0.2, 0, 0]]
    )

    assert result["collision"] is True

    # Robot must remain at its current position
    assert current_position == [5, 3, 2]