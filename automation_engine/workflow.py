import time

from automation_engine.validator import TaskValidator
from automation_engine.executor import TaskExecutor
from automation_engine.recovery import FailureRecovery
from monitoring.logger import AutomationLogger
from database.job_repository import JobRepository


class AutomationWorkflow:

    def __init__(
        self,
        job_id,
        job_name,
        priority="MEDIUM",
        max_retries=3
    ):
        self.job_id = job_id
        self.job_name = job_name
        self.priority = priority
        self.status = "CREATED"
        self.max_retries = max_retries

        self.validator = TaskValidator()
        self.executor = TaskExecutor(max_retries)
        self.recovery = FailureRecovery(max_retries)
        self.logger = AutomationLogger()
        self.repository = JobRepository()

    def execute(self):

        start_time = time.perf_counter()
        attempts = 0

        print(f"\nJob ID: {self.job_id}")
        print(f"Job Name: {self.job_name}")
        print(f"Priority: {self.priority}")

        # Save job in database
        self.repository.create_job(
            job_id=self.job_id,
            job_name=self.job_name,
            priority=self.priority,
            status="CREATED"
        )

        self.logger.info(
            f"Job {self.job_id} started: {self.job_name}"
        )

        # Step 1: Validate
        print("\n[1] Validating task...")

        is_valid, message = self.validator.validate(
            self.job_name
        )

        if not is_valid:

            self.status = "FAILED"

            print(f"Validation failed: {message}")

            execution_time = time.perf_counter() - start_time

            self.repository.update_job(
                self.job_id,
                self.status,
                attempts,
                execution_time,
                message
            )

            self.logger.error(
                f"Job {self.job_id} validation failed: {message}"
            )

            return self._build_result(
                attempts,
                execution_time,
                message
            )

        print(f"Validation successful: {message}")

        self.logger.info(
            f"Job {self.job_id} validation successful"
        )

        # Step 2: Execute with retry and recovery
        print("\n[2] Executing task...")

        self.status = "RUNNING"

        for attempt in range(1, self.max_retries + 1):

            attempts = attempt

            result = self.executor.execute(
                self.job_name,
                attempt
            )

            if result["success"]:

                self.status = "COMPLETED"

                self.logger.info(
                    f"Job {self.job_id} completed successfully "
                    f"on attempt {attempt}"
                )

                break

            print("Task failed.")

            self.logger.warning(
                f"Job {self.job_id} failed on attempt {attempt}: "
                f"{result['message']}"
            )

            recovery = self.recovery.get_recovery_action(
                attempt=attempt,
                retry_required=result["retry"]
            )

            print(f"Recovery Action: {recovery['action']}")
            print(recovery["message"])

            self.logger.info(
                f"Job {self.job_id} recovery action: "
                f"{recovery['action']}"
            )

            if recovery["action"] == "FAIL":

                self.status = "FAILED"

                self.logger.error(
                    f"Job {self.job_id} failed after "
                    f"{self.max_retries} attempts"
                )

        # Step 3: Calculate execution time
        execution_time = time.perf_counter() - start_time

        # Step 4: Update database
        self.repository.update_job(
            self.job_id,
            self.status,
            attempts,
            execution_time,
            result["message"]
        )

        # Step 5: Final result
        print("\n[3] Checking result...")
        print(f"Final Status: {self.status}")
        print(f"Attempts: {attempts}")
        print(
            f"Execution Time: {execution_time:.4f} seconds"
        )

        self.logger.info(
            f"Job {self.job_id} finished with status: "
            f"{self.status}"
        )

        return self._build_result(
            attempts,
            execution_time,
            result["message"]
        )

    def _build_result(
        self,
        attempts,
        execution_time,
        message
    ):

        return {
            "job_id": self.job_id,
            "job_name": self.job_name,
            "priority": self.priority,
            "status": self.status,
            "attempts": attempts,
            "execution_time": round(
                execution_time,
                4
            ),
            "message": message
        }