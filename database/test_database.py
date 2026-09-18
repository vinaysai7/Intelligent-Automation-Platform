from database.job_repository import JobRepository


def main():

    repository = JobRepository()

    database_id = repository.create_job(
        job_id=2001,
        job_name="Database Connection Test",
        priority="HIGH"
    )

    print(f"Job created successfully.")
    print(f"Database ID: {database_id}")


if __name__ == "__main__":
    main()