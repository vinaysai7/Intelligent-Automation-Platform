class TaskValidator:

    def validate(self, task_name):

        if not task_name:
            return False, "Task name cannot be empty"

        if not isinstance(task_name, str):
            return False, "Task name must be a string"

        return True, "Validation successful"