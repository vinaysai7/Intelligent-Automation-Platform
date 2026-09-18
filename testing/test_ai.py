from ai.anomaly_detector import AnomalyDetector


def test_anomaly_detection():

    detector = AnomalyDetector()

    training_data = [
        0.04,
        0.05,
        0.06,
        0.07,
        0.08,
        0.09,
        0.10,
        0.11,
        0.12,
        0.13
    ]

    detector.train(training_data)

    normal_result = detector.predict(0.08)
    anomaly_result = detector.predict(2.5)

    assert normal_result == "NORMAL"
    assert anomaly_result == "ANOMALY"