import subprocess
import sys
import re


class TestRunner:

    def run_tests(self):
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "testing",
                    "-v",
                    "--tb=no"
                ],
                capture_output=True,
                text=True,
                timeout=120
            )

            output = result.stdout + "\n" + result.stderr

            tests = self._extract_test_results(output)

            passed = len(
                [test for test in tests if test["status"] == "PASSED"]
            )

            failed = len(
                [test for test in tests if test["status"] == "FAILED"]
            )

            skipped = len(
                [test for test in tests if test["status"] == "SKIPPED"]
            )

            warnings = self._extract_count(
                output,
                r"(\d+)\s+warning"
            )

            total = passed + failed + skipped

            # Fallback to pytest summary when individual parsing
            # does not capture every test.
            if total == 0:
                passed = self._extract_count(
                    output,
                    r"(\d+)\s+passed"
                )

                failed = self._extract_count(
                    output,
                    r"(\d+)\s+failed"
                )

                skipped = self._extract_count(
                    output,
                    r"(\d+)\s+skipped"
                )

                total = passed + failed + skipped

            status = "PASSED" if result.returncode == 0 else "FAILED"

            return {
                "status": status,
                "total_tests": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "warnings": warnings,
                "exit_code": result.returncode,
                "tests": tests
            }

        except subprocess.TimeoutExpired:
            return {
                "status": "TIMEOUT",
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "warnings": 0,
                "exit_code": -1,
                "tests": []
            }

        except Exception as error:
            return {
                "status": "ERROR",
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "warnings": 0,
                "exit_code": -1,
                "tests": [],
                "message": str(error)
            }

    @staticmethod
    def _extract_test_results(output):
        tests = []

        pattern = re.compile(
            r"^(.+?)\s+(PASSED|FAILED|SKIPPED|XFAIL|XPASS)(?:\s+\[.*\])?$",
            re.MULTILINE
        )

        for match in pattern.finditer(output):
            test_name = match.group(1).strip()
            status = match.group(2).strip()

            # Ignore pytest internal/result lines.
            if (
                test_name
                and not test_name.startswith("=")
                and "short test summary" not in test_name.lower()
            ):
                tests.append(
                    {
                        "name": test_name,
                        "status": status
                    }
                )

        return tests

    @staticmethod
    def _extract_count(output, pattern):
        matches = re.findall(pattern, output)

        if matches:
            return int(matches[-1])

        return 0