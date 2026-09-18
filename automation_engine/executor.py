class TaskExecutor:

    def __init__(self, max_retries=3):
        self.max_retries = max_retries

    def execute(self, task_name, attempt=1):

        print(f"Executing task: {task_name}")
        print(f"Attempt: {attempt}/{self.max_retries}")

        if not task_name:
            return {
                "success": False,
                "message": "Task name is required",
                "retry": False
            }

        # Simulate temporary failure on first two attempts
        if task_name == "Component Inspection" and attempt < 3:
            return {
                "success": False,
                "message": "Temporary inspection system failure",
                "retry": True
            }

        return {
            "success": True,
            "message": f"Task '{task_name}' executed successfully",
            "retry": False
        }