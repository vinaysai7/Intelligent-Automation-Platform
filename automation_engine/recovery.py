class FailureRecovery:

    def __init__(self, max_retries=3):
        self.max_retries = max_retries

    def should_retry(self, attempt, retry_required):
        if not retry_required:
            return False

        return attempt < self.max_retries

    def get_recovery_action(self, attempt, retry_required):

        if not retry_required:
            return {
                "action": "STOP",
                "message": "No recovery required"
            }

        if attempt < self.max_retries:
            return {
                "action": "RETRY",
                "message": f"Retrying task (attempt {attempt + 1}/{self.max_retries})"
            }

        return {
            "action": "FAIL",
            "message": "Maximum retry attempts reached"
        }