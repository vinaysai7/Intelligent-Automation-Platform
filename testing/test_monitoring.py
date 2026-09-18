from monitoring.metrics import MonitoringMetrics


def test_job_metrics():

    metrics = MonitoringMetrics()

    result = metrics.get_job_metrics()

    assert "total_jobs" in result
    assert "completed_jobs" in result
    assert "failed_jobs" in result
    assert "total_attempts" in result
    assert "average_execution_time" in result

    assert result["total_jobs"] >= 0
    assert result["completed_jobs"] >= 0
    assert result["failed_jobs"] >= 0
    assert result["total_attempts"] >= 0
    assert result["average_execution_time"] >= 0