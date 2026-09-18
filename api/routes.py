from api.test_runner import TestRunner
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from automation_engine.workflow import AutomationWorkflow

from database.robot_repository import RobotRepository
from database.robot_history_repository import RobotHistoryRepository

from ai.anomaly_service import AnomalyService

from robotics.robot import Robot
from robotics.collision import CollisionDetector
from monitoring.metrics import MonitoringMetrics


router = APIRouter()


class JobRequest(BaseModel):
    job_id: int
    job_name: str
    priority: str = "MEDIUM"


# ============================================================
# GENERAL API
# ============================================================

@router.get("/test")
def test_api():
    return {
        "message": "API routes are working"
    }


# ============================================================
# JOB AUTOMATION
# ============================================================

@router.post("/jobs")
def create_job(job: JobRequest):

    workflow = AutomationWorkflow(
        job_id=job.job_id,
        job_name=job.job_name,
        priority=job.priority
    )

    result = workflow.execute()

    return result


@router.get("/jobs/{job_id}")
def get_job(job_id: int):

    from database.connection import get_connection

    connection = get_connection()

    try:
        cursor = connection.cursor()

        query = """
            SELECT
                job_id,
                job_name,
                priority,
                status,
                attempts,
                execution_time,
                message,
                created_at
            FROM jobs
            WHERE job_id = %s;
        """

        cursor.execute(query, (job_id,))

        job = cursor.fetchone()

        if job is None:
            return {
                "message": "Job not found"
            }

        return {
            "job_id": job[0],
            "job_name": job[1],
            "priority": job[2],
            "status": job[3],
            "attempts": job[4],
            "execution_time": job[5],
            "message": job[6],
            "created_at": job[7]
        }

    finally:
        connection.close()


@router.get("/jobs")
def get_all_jobs():

    from database.connection import get_connection

    connection = get_connection()

    try:
        cursor = connection.cursor()

        query = """
            SELECT
                job_id,
                job_name,
                priority,
                status,
                attempts,
                execution_time,
                message,
                created_at
            FROM jobs
            ORDER BY id DESC;
        """

        cursor.execute(query)

        jobs = cursor.fetchall()

        results = []

        for job in jobs:
            results.append({
                "job_id": job[0],
                "job_name": job[1],
                "priority": job[2],
                "status": job[3],
                "attempts": job[4],
                "execution_time": job[5],
                "message": job[6],
                "created_at": job[7]
            })

        return {
            "total_jobs": len(results),
            "jobs": results
        }

    finally:
        connection.close()


# ============================================================
# AI ANOMALY DETECTION
# ============================================================

@router.get("/ai/anomalies")
def analyze_anomalies():

    service = AnomalyService()

    return service.analyze_jobs()


# ============================================================
# ROBOTICS SIMULATION
# ============================================================

from robotics.simulation import RobotSimulation


@router.get("/robots/simulation/status")
def get_simulation_status():
    simulation = RobotSimulation()
    return simulation.status()


@router.post("/robots/simulation/move")
def move_simulation_robot(
    x: float,
    y: float,
    z: float
):
    simulation = RobotSimulation()
    return simulation.move_to(x, y, z)




# ============================================================
# ROBOT MOVEMENT
# ============================================================

@router.post("/robots/{robot_id}/move")
def move_robot(
    robot_id: int,
    x: float,
    y: float,
    z: float
):

    repository = RobotRepository()
    history_repository = RobotHistoryRepository()

    robot_data = repository.get_robot(robot_id)

    # Create robot if it does not exist
    if robot_data is None:

        repository.create_robot(
            robot_id=robot_id,
            robot_name=f"Robot-{robot_id}",
            status="IDLE"
        )

        robot_data = repository.get_robot(robot_id)

    # --------------------------------------------------------
    # Collision / Safety Check
    # --------------------------------------------------------

    detector = CollisionDetector()

    obstacles = [
        [0.2, 0, 0],
        [2, 2, 2]
    ]

    collision_result = detector.check_collision(
        [x, y, z],
        obstacles
    )

    # --------------------------------------------------------
    # Reject Unsafe Movement
    # --------------------------------------------------------

    if collision_result["collision"]:

        history_repository.add_event(
            robot_id=robot_id,
            operation="MOVE",
            status="REJECTED",
            x=x,
            y=y,
            z=z,
            message="Movement rejected: obstacle detected"
        )

        raise HTTPException(
            status_code=409,
            detail={
                "robot_id": robot_id,
                "status": "MOVEMENT_REJECTED",
                "position": robot_data["position"],
                "message": "Movement rejected: obstacle detected",
                "collision": collision_result
            }
        )

    # --------------------------------------------------------
    # Safe Movement
    # --------------------------------------------------------

    robot = Robot(
        robot_id=robot_id,
        name=robot_data["robot_name"]
    )

    robot.position = robot_data["position"]

    result = robot.move_to(x, y, z)

    # Update persistent robot state
    repository.update_robot(
        robot_id=robot_id,
        status=result["status"],
        x=x,
        y=y,
        z=z
    )

    # Record successful movement
    history_repository.add_event(
        robot_id=robot_id,
        operation="MOVE",
        status="SUCCESS",
        x=x,
        y=y,
        z=z,
        message="Robot moved successfully"
    )

    return {
        **result,
        "collision": collision_result
    }


# ============================================================
# ROBOT STATUS
# ============================================================

@router.get("/robots/{robot_id}")
def get_robot_status(robot_id: int):

    repository = RobotRepository()

    robot = repository.get_robot(robot_id)

    if robot is None:
        return {
            "message": "Robot not found"
        }

    return robot


# ============================================================
# ROBOT HISTORY
# ============================================================

@router.get("/robots/{robot_id}/history")
def get_robot_history(robot_id: int):

    history_repository = RobotHistoryRepository()

    history = history_repository.get_history(robot_id)

    return {
        "robot_id": robot_id,
        "total_events": len(history),
        "history": history
    }


# ============================================================
# ROBOT INSPECTION
# ============================================================

@router.post("/robots/{robot_id}/inspect")
def inspect_robot(robot_id: int):

    repository = RobotRepository()

    robot_data = repository.get_robot(robot_id)

    # Create robot if it does not exist
    if robot_data is None:

        repository.create_robot(
            robot_id=robot_id,
            robot_name=f"Robot-{robot_id}",
            status="IDLE"
        )

        robot_data = repository.get_robot(robot_id)

    robot = Robot(
        robot_id=robot_id,
        name=robot_data["robot_name"]
    )

    # Use persistent robot position
    current_position = robot_data["position"]

    robot.position = current_position

    result = robot.inspect()

    # Update robot state
    repository.update_robot(
        robot_id=robot_id,
        status=result["status"],
        x=current_position[0],
        y=current_position[1],
        z=current_position[2]
    )

    # Record inspection history
    history_repository = RobotHistoryRepository()

    history_repository.add_event(
        robot_id=robot_id,
        operation="INSPECTION",
        status="COMPLETED",
        x=current_position[0],
        y=current_position[1],
        z=current_position[2],
        message="Robot inspection completed"
    )

    return result


# ============================================================
# ROBOT COLLISION CHECK
# ============================================================

@router.post("/robots/{robot_id}/collision-check")
def check_robot_collision(
    robot_id: int,
    x: float,
    y: float,
    z: float
):

    detector = CollisionDetector()

    obstacles = [
        [0.2, 0, 0],
        [2, 2, 2]
    ]

    result = detector.check_collision(
        [x, y, z],
        obstacles
    )

    return {
        "robot_id": robot_id,
        **result
    }


@router.get("/monitoring/metrics")
def get_monitoring_metrics():

    metrics = MonitoringMetrics()

    return metrics.get_job_metrics()

@router.post("/testing/run")
def run_test_suite():
    runner = TestRunner()
    return runner.run_tests()

@router.get("/system/health")
def get_system_health():
    from database.connection import get_connection

    health = {
        "fastapi": "Healthy",
        "postgresql": "Disconnected",
        "automation_engine": "Running",
    }

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1;")
        cursor.fetchone()

        health["postgresql"] = "Connected"

    except Exception as error:
        health["postgresql"] = "Disconnected"
        health["database_error"] = str(error)

    finally:
        if connection:
            connection.close()

    return health