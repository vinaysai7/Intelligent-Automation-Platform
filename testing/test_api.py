from fastapi.testclient import TestClient

from api.app import app
from database.connection import get_connection


client = TestClient(app)


def cleanup_job(job_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM jobs WHERE job_id = %s;",
            (job_id,)
        )

        connection.commit()

    finally:
        connection.close()


def test_health_check():

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_job():

    job_id = 9001

    cleanup_job(job_id)

    response = client.post(
        "/jobs",
        json={
            "job_id": job_id,
            "job_name": "API Test Job",
            "priority": "MEDIUM"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["job_id"] == job_id
    assert data["job_name"] == "API Test Job"
    assert data["status"] == "COMPLETED"

    cleanup_job(job_id)


def test_get_job():

    job_id = 9002

    cleanup_job(job_id)

    client.post(
        "/jobs",
        json={
            "job_id": job_id,
            "job_name": "API Get Test Job",
            "priority": "MEDIUM"
        }
    )

    response = client.get(f"/jobs/{job_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["job_id"] == job_id
    assert data["status"] == "COMPLETED"

    cleanup_job(job_id)


def test_get_all_jobs():

    response = client.get("/jobs")

    assert response.status_code == 200

    data = response.json()

    assert "total_jobs" in data
    assert "jobs" in data
    assert data["total_jobs"] >= 1


def test_robot_collision_rejected():

    response = client.post(
        "/robots/1/move",
        params={
            "x": 0,
            "y": 0,
            "z": 0
        }
    )

    assert response.status_code == 409

    data = response.json()

    assert data["detail"]["status"] == "MOVEMENT_REJECTED"
    assert data["detail"]["position"] == [6.0, 4.0, 3.0]
    assert data["detail"]["collision"]["collision"] is True