from automation_engine.workflow import AutomationWorkflow


def main():

    jobs = [
        {
            "job_id": 1001,
            "job_name": "Component Inspection",
            "priority": "HIGH"
        },
        {
            "job_id": 1002,
            "job_name": "Quality Check",
            "priority": "MEDIUM"
        },
        {
            "job_id": 1003,
            "job_name": "Inventory Update",
            "priority": "LOW"
        },
        {
            "job_id": 1004,
            "job_name": "Equipment Diagnostics",
            "priority": "HIGH"
        }
    ]

    priority_order = {
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3
    }

    jobs.sort(
        key=lambda job: priority_order[job["priority"]]
    )

    for job_data in jobs:

        print("\n" + "=" * 60)

        job = AutomationWorkflow(
            job_id=job_data["job_id"],
            job_name=job_data["job_name"],
            priority=job_data["priority"]
        )

        result = job.execute()

        print("\nAutomation Result:")
        print(result)


if __name__ == "__main__":
    main()