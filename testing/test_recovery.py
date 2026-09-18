from automation_engine.recovery import FailureRecovery


def test_retry_recovery():

    recovery = FailureRecovery(max_retries=3)

    result = recovery.get_recovery_action(
        attempt=1,
        retry_required=True
    )

    assert result["action"] == "RETRY"


def test_stop_when_retry_not_required():

    recovery = FailureRecovery(max_retries=3)

    result = recovery.get_recovery_action(
        attempt=1,
        retry_required=False
    )

    assert result["action"] == "STOP"


def test_fail_after_max_retries():

    recovery = FailureRecovery(max_retries=3)

    result = recovery.get_recovery_action(
        attempt=3,
        retry_required=True
    )

    assert result["action"] == "FAIL"