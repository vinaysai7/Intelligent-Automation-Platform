import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyDetector:

    def __init__(self):

        self.model = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=200
        )

        self.mean = None
        self.std = None

    def train(self, execution_data):

        data = np.array(execution_data, dtype=float)

        self.mean = np.mean(data)
        self.std = np.std(data)

        self.model.fit(data.reshape(-1, 1))

    def predict(self, execution_time):

        if self.mean is None or self.std is None:
            raise ValueError("Model must be trained before prediction")

        # Statistical anomaly check
        if self.std > 0:
            z_score = abs(
                (execution_time - self.mean) / self.std
            )

            if z_score > 3:
                return "ANOMALY"

        # Machine-learning anomaly check
        result = self.model.predict(
            np.array([[execution_time]])
        )

        if result[0] == -1:
            return "ANOMALY"

        return "NORMAL"