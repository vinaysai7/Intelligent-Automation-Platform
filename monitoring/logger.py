import logging
import os


class AutomationLogger:

    def __init__(self):
        os.makedirs("logs", exist_ok=True)

        logging.basicConfig(
            filename="logs/automation.log",
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s"
        )

        self.logger = logging.getLogger("AutomationEngine")

    def info(self, message):
        self.logger.info(message)

    def warning(self, message):
        self.logger.warning(message)

    def error(self, message):
        self.logger.error(message)