from automation_engine.workflow import AutomationWorkflow
from database.connection import get_connection


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


def test_successful_job():

    job_id = 8002

    cleanup_job(job_id)

    workflow = AutomationWorkflow(
        job_id=job_id,
        job_name="Quality Check",
        priority="MEDIUM"
    )

    result = workflow.execute()

    assert result["status"] == "COMPLETED"
    assert result["attempts"] == 1

    cleanup_job(job_id)


def test_retry_mechanism():

    job_id = 8003

    cleanup_job(job_id)

    workflow = AutomationWorkflow(
        job_id=job_id,
        job_name="Component Inspection",
        priority="HIGH"
    )

    result = workflow.execute()

    assert result["status"] == "COMPLETED"
    assert result["attempts"] == 3

    cleanup_job(job_id)


def test_invalid_job():

    job_id = 8004

    cleanup_job(job_id)

    workflow = AutomationWorkflow(
        job_id=job_id,
        job_name="",
        priority="LOW"
    )

    result = workflow.execute()

    assert result["status"] == "FAILED"

    cleanup_job(job_id)