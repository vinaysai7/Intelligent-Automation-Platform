from ai.anomaly_detector import AnomalyDetector
from database.job_repository import JobRepository


class AnomalyService:

    def __init__(self):

        self.detector = AnomalyDetector()
        self.repository = JobRepository()

    def analyze_jobs(self):

        execution_times = self.repository.get_execution_times()

        if len(execution_times) < 5:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": "At least 5 execution records are required",
                "anomalies": []
            }

        self.detector.train(execution_times)

        anomalies = []

        for execution_time in execution_times:

            result = self.detector.predict(execution_time)

            if result == "ANOMALY":
                anomalies.append({
                    "execution_time": execution_time,
                    "status": "ANOMALY"
                })

        return {
            "status": "ANALYZED",
            "total_records": len(execution_times),
            "anomaly_count": len(anomalies),
            "anomalies": anomalies
        }