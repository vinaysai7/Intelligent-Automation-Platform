"use client";

import { useEffect, useState } from "react";

type Metrics = {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_attempts: number;
  average_execution_time: number;
};

type Job = {
  job_id: number;
  job_name: string;
  priority: string;
  status: string;
  attempts: number;
  execution_time: number;
};

type Robot = {
  robot_id: number;
  robot_name: string;
  status: string;
  position: number[];
};

type AIAnalysis = {
  status: string;
  total_records?: number;
  anomaly_count?: number;
  anomalies?: {
    execution_time: number;
    status: string;
  }[];
  message?: string;
};

type RobotHistoryEvent = {
  robot_id: number;
  operation: string;
  status: string;
  position: number[];
  message: string | null;
  created_at: string;
};

type TestCaseResult = {
  name: string;
  status: string;
};

type TestResults = {
  status: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  exit_code: number;
  tests: TestCaseResult[];
};

type SystemHealth = {
  fastapi: string;
  postgresql: string;
  automation_engine: string;
  database_error?: string;
};

type SimulationStatus = {
  simulation: string;
  robot_position: number[];
  obstacles: { name: string; position: number[]; radius: number }[];
  safety_distance: number;
};

type SimulationMoveResult = {
  status: string;
  previous_position: number[];
  robot_position: number[];
  target_position: number[];
  distance: number;
  collision: { collision: boolean; obstacle: string | null; distance: number | null };
  message: string;
};

const API_URL = "http://127.0.0.1:8000";

const SIMULATION_VIEW = {
  minX: -1,
  maxX: 5,
  minY: -1,
  maxY: 5,
};

const simulationPoint = (position: number[] | undefined) => {
  if (!position || position.length < 2) return null;

  const width = 600;
  const height = 320;
  const padding = 28;
  const x = padding + ((Number(position[0]) - SIMULATION_VIEW.minX) / (SIMULATION_VIEW.maxX - SIMULATION_VIEW.minX)) * (width - padding * 2);
  const y = height - padding - ((Number(position[1]) - SIMULATION_VIEW.minY) / (SIMULATION_VIEW.maxY - SIMULATION_VIEW.minY)) * (height - padding * 2);

  return { x, y };
};

const simulationRadius = (radius: number) => {
  const scale = (600 - 28 * 2) / (SIMULATION_VIEW.maxX - SIMULATION_VIEW.minX);
  return Math.max(9, radius * scale);
};

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);
  const [simulationMove, setSimulationMove] = useState<SimulationMoveResult | null>(null);
  const [simulationX, setSimulationX] = useState("");
  const [simulationY, setSimulationY] = useState("");
  const [simulationZ, setSimulationZ] = useState("");
  const [movingSimulation, setMovingSimulation] = useState(false);

  // Create Automation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jobName, setJobName] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [creatingJob, setCreatingJob] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  // Robot control state
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [robotX, setRobotX] = useState("");
  const [robotY, setRobotY] = useState("");
  const [robotZ, setRobotZ] = useState("");
  const [movingRobot, setMovingRobot] = useState(false);
  const [robotMessage, setRobotMessage] = useState("");

  // Robot inspection and history state
  const [inspectingRobot, setInspectingRobot] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [robotHistory, setRobotHistory] = useState<
    RobotHistoryEvent[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load monitoring metrics
    fetch(`${API_URL}/monitoring/metrics`)
      .then((response) => response.json())
      .then((data) => setMetrics(data))
      .catch((error) =>
        console.error("Failed to load metrics:", error)
      );

    // Load automation jobs
    fetch(`${API_URL}/jobs`)
      .then((response) => response.json())
      .then((data) => setJobs(data.jobs || []))
      .catch((error) =>
        console.error("Failed to load jobs:", error)
      );

    // Load robotics fleet
    Promise.all([
      fetch(`${API_URL}/robots/1`),
      fetch(`${API_URL}/robots/2`),
      fetch(`${API_URL}/robots/3`),
    ])
      .then(async (responses) => {
        const data = await Promise.all(
          responses.map((response) => response.json())
        );

        return data;
      })
      .then((data) => {
        const validRobots = data.filter(
          (robot) => robot && robot.robot_id
        );

        setRobots(validRobots);
      })
      .catch((error) =>
        console.error("Failed to load robots:", error)
      );

    // Load AI anomaly analysis
    fetch(`${API_URL}/ai/anomalies`)
      .then((response) => response.json())
      .then((data) => setAiAnalysis(data))
      .catch((error) =>
        console.error("Failed to load AI analysis:", error)
      );

    // Load real system health
    fetch(`${API_URL}/system/health`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load system health");
        return response.json();
      })
      .then((data) => setSystemHealth(data))
      .catch((error) => {
        console.error("Failed to load system health:", error);
        setSystemHealth({
          fastapi: "Unreachable",
          postgresql: "Unknown",
          automation_engine: "Unknown",
        });
      });

    // Load robotics simulation status
    fetch(`${API_URL}/robots/simulation/status`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load simulation status");
        return response.json();
      })
      .then((data) => setSimulationStatus(data))
      .catch((error) => console.error("Failed to load simulation status:", error));
  };

  const moveSimulationRobot = async () => {
    if (simulationX.trim() === "" || simulationY.trim() === "" || simulationZ.trim() === "") return;

    const x = Number(simulationX);
    const y = Number(simulationY);
    const z = Number(simulationZ);

    if (![x, y, z].every(Number.isFinite)) return;

    setMovingSimulation(true);
    setSimulationMove(null);

    try {
      const response = await fetch(
        `${API_URL}/robots/simulation/move?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&z=${encodeURIComponent(z)}`,
        { method: "POST" }
      );

      const data = await response.json();
      setSimulationMove(data);

      if (data.robot_position) {
        setSimulationStatus((current) =>
          current
            ? { ...current, robot_position: data.robot_position }
            : current
        );
      }
    } catch (error) {
      console.error("Simulation movement failed:", error);
    } finally {
      setMovingSimulation(false);
    }
  };


  const runTestSuite = async () => {
    setRunningTests(true);

    try {
      const response = await fetch(`${API_URL}/testing/run`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run test suite");
      }

      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error("Test execution failed:", error);
    } finally {
      setRunningTests(false);
    }
  };

  // Create automation
  const createAutomation = async () => {
    if (!jobName.trim()) {
      setCreateMessage("Job name is required.");
      return;
    }

    setCreatingJob(true);
    setCreateMessage("");

    try {
      const jobId = Math.floor(
        100000000 + Math.random() * 900000000
      );

      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          job_name: jobName.trim(),
          priority: priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create automation"
        );
      }

      setCreateMessage("Automation created successfully.");

      setJobName("");
      setPriority("MEDIUM");

      await loadDashboardData();

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateMessage("");
      }, 1000);
    } catch (error) {
      console.error("Failed to create automation:", error);

      setCreateMessage(
        error instanceof Error
          ? error.message
          : "Failed to create automation."
      );
    } finally {
      setCreatingJob(false);
    }
  };

  // Open robot control
  const openRobotControl = (robot: Robot) => {
    setSelectedRobot(robot);

    setRobotX(
      String(robot.position[0] ?? 0)
    );

    setRobotY(
      String(robot.position[1] ?? 0)
    );

    setRobotZ(
      String(robot.position[2] ?? 0)
    );

    setRobotMessage("");
  };

  // Move robot
  const moveRobot = async () => {
    if (!selectedRobot) return;

    if (
      robotX.trim() === "" ||
      robotY.trim() === "" ||
      robotZ.trim() === ""
    ) {
      setRobotMessage(
        "Please enter X, Y and Z coordinates."
      );

      return;
    }

    const x = Number(robotX);
    const y = Number(robotY);
    const z = Number(robotZ);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z)
    ) {
      setRobotMessage(
        "Coordinates must be valid numbers."
      );

      return;
    }

    setMovingRobot(true);
    setRobotMessage("");

    try {
      const response = await fetch(
        `${API_URL}/robots/${selectedRobot.robot_id}/move?x=${encodeURIComponent(
          x
        )}&y=${encodeURIComponent(
          y
        )}&z=${encodeURIComponent(z)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRobotMessage(
          data.detail?.message ||
            "Movement rejected by robotics system."
        );

        return;
      }

      setRobotMessage(
        "Robot moved successfully."
      );

      await loadDashboardData();

      // Refresh selected robot
      const refreshedResponse = await fetch(
        `${API_URL}/robots/${selectedRobot.robot_id}`
      );

      const refreshedRobot =
        await refreshedResponse.json();

      if (refreshedRobot?.robot_id) {
        setSelectedRobot(refreshedRobot);
      }

      setRobotX(String(x));
      setRobotY(String(y));
      setRobotZ(String(z));
    } catch (error) {
      console.error(
        "Robot movement failed:",
        error
      );

      setRobotMessage(
        "Failed to connect to robotics API."
      );
    } finally {
      setMovingRobot(false);
    }
  };

  // Inspect robot
  const inspectRobot = async () => {
    if (!selectedRobot) return;

    setInspectingRobot(true);
    setRobotMessage("");

    try {
      const response = await fetch(
        `${API_URL}/robots/${selectedRobot.robot_id}/inspect`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRobotMessage(
          data.detail?.message ||
            "Robot inspection failed."
        );

        return;
      }

      setRobotMessage(
        "Robot inspection completed."
      );

      await loadDashboardData();

      // Refresh selected robot
      const refreshedResponse = await fetch(
        `${API_URL}/robots/${selectedRobot.robot_id}`
      );

      const refreshedRobot =
        await refreshedResponse.json();

      if (refreshedRobot?.robot_id) {
        setSelectedRobot(refreshedRobot);

        setRobotX(
          String(refreshedRobot.position[0] ?? 0)
        );

        setRobotY(
          String(refreshedRobot.position[1] ?? 0)
        );

        setRobotZ(
          String(refreshedRobot.position[2] ?? 0)
        );
      }
    } catch (error) {
      console.error(
        "Robot inspection failed:",
        error
      );

      setRobotMessage(
        "Failed to connect to robotics API."
      );
    } finally {
      setInspectingRobot(false);
    }
  };

  // Load robot history
  const loadRobotHistory = async () => {
    if (!selectedRobot) return;

    setHistoryLoading(true);
    setRobotMessage("");

    try {
      const response = await fetch(
        `${API_URL}/robots/${selectedRobot.robot_id}/history`
      );

      const data = await response.json();

      if (!response.ok) {
        setRobotMessage(
          "Failed to load robot history."
        );

        return;
      }

      setRobotHistory(data.history || []);
      setShowHistory(true);
    } catch (error) {
      console.error(
        "Failed to load robot history:",
        error
      );

      setRobotMessage(
        "Failed to connect to robotics history API."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeRobotControl = () => {
    if (movingRobot || inspectingRobot) return;

    setSelectedRobot(null);
    setRobotMessage("");
  };

  const successRate =
    metrics && metrics.total_jobs > 0
      ? (
          (metrics.completed_jobs /
            metrics.total_jobs) *
          100
        ).toFixed(1)
      : "—";

  const kpis = [
    {
      label: "Total Jobs",
      value: metrics
        ? String(metrics.total_jobs)
        : "—",
      detail: "Automation jobs",
      icon: "⚙",
    },
    {
      label: "Completed",
      value: metrics
        ? String(metrics.completed_jobs)
        : "—",
      detail: metrics
        ? `${successRate}% success rate`
        : "Loading...",
      icon: "✓",
    },
    {
      label: "Failed",
      value: metrics
        ? String(metrics.failed_jobs)
        : "—",
      detail: "Requires attention",
      icon: "!",
    },
    {
      label: "Avg. Execution",
      value: metrics
        ? `${metrics.average_execution_time}s`
        : "—",
      detail: "Average runtime",
      icon: "◷",
    },
  ];

  const aiStatus =
    aiAnalysis?.status === "ANALYZED"
      ? aiAnalysis.anomaly_count &&
        aiAnalysis.anomaly_count > 0
        ? `${aiAnalysis.anomaly_count} Anomal${
            aiAnalysis.anomaly_count > 1
              ? "ies"
              : "y"
          } Detected`
        : "No Anomalies"
      : aiAnalysis?.status ===
        "INSUFFICIENT_DATA"
      ? "Insufficient Data"
      : "Analyzing...";

  const aiStatusClass =
    aiAnalysis?.status === "ANALYZED"
      ? aiAnalysis.anomaly_count &&
        aiAnalysis.anomaly_count > 0
        ? "text-amber-300"
        : "text-emerald-300"
      : "text-slate-400";

  const completedJobs = jobs.filter((job) => job.status === "COMPLETED");
  const failedJobs = jobs.filter((job) => job.status !== "COMPLETED");
  const totalAttempts = jobs.reduce((sum, job) => sum + (Number(job.attempts) || 0), 0);
  const runtimeValues = jobs
    .map((job) => Number(job.execution_time) || 0)
    .filter((runtime) => runtime >= 0);
  const averageRuntime = runtimeValues.length
    ? runtimeValues.reduce((sum, runtime) => sum + runtime, 0) / runtimeValues.length
    : 0;
  const fastestRuntime = runtimeValues.length ? Math.min(...runtimeValues) : 0;
  const slowestRuntime = runtimeValues.length ? Math.max(...runtimeValues) : 0;
  const performanceJobs = [...jobs]
    .sort((a, b) => b.job_id - a.job_id)
    .slice(0, 6);
  const maxPerformanceRuntime = Math.max(
    ...performanceJobs.map((job) => Number(job.execution_time) || 0),
    0.001
  );

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100">

      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a0f18]">

        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold shadow-lg shadow-blue-600/20">
              IA
            </div>

            <div>

              <h1 className="text-lg font-semibold tracking-wide">
                Intelligent Automation Platform
              </h1>

              <p className="text-xs text-slate-500">
                Automation • AI • Robotics • Testing
              </p>

            </div>

          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2 rounded-full border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-400">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              SYSTEM ONLINE

            </div>

            <div className="hidden text-right sm:block">

              <p className="text-xs text-slate-400">
                Environment
              </p>

              <p className="text-sm font-medium">
                Development
              </p>

            </div>

          </div>

        </div>

      </header>

      <div className="mx-auto flex max-w-[1600px]">

        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-74px)] w-60 border-r border-slate-800 bg-[#090e16] p-4 lg:block">

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Control Center
          </p>

          <nav className="space-y-1">

            <div className="rounded-lg bg-blue-600/15 px-3 py-2.5 text-sm font-medium text-blue-400">
              ▣ Dashboard
            </div>

            <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
              ⚙ Automation Jobs
            </div>

            <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
              🤖 Robotics
            </div>

            <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
              🧠 AI Analytics
            </div>

            <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
              ◉ Monitoring
            </div>

            <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
              ✓ Testing
            </div>

          </nav>

          <div className="mt-10 border-t border-slate-800 pt-5">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              System
            </p>

            <div className="space-y-1">

              <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
                API Status
              </div>

              <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
                Database
              </div>

              <div className="rounded-lg px-3 py-2.5 text-sm text-slate-400">
                Configuration
              </div>

            </div>

          </div>

        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 sm:p-7">

          {/* Page Title */}
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                Operations Overview
              </p>

              <h2 className="text-2xl font-semibold tracking-tight">
                Automation Control Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor jobs, robots, AI diagnostics and system performance.
              </p>

            </div>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateMessage("");
              }}
              className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              + Create Automation
            </button>

          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {kpis.map((kpi) => (

              <div
                key={kpi.label}
                className="rounded-xl border border-slate-800 bg-[#0c121c] p-5 transition hover:border-slate-700"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {kpi.label}
                    </p>

                    <p className="mt-3 text-2xl font-semibold">
                      {kpi.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {kpi.detail}
                    </p>

                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm text-blue-400">
                    {kpi.icon}
                  </div>

                </div>

              </div>

            ))}

          </div>

          {/* Middle Section */}
          <div className="mt-5 grid gap-5 xl:grid-cols-3">

            {/* Robotics */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121c] xl:col-span-2">

              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

                <div>

                  <h3 className="font-semibold">
                    Robotics Fleet
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Live robotic platform status
                  </p>

                </div>

                <span className="text-xs text-slate-500">
                  {robots.length} units registered
                </span>

              </div>

              <div className="divide-y divide-slate-800">

                {robots.length === 0 ? (

                  <div className="px-5 py-8 text-center text-sm text-slate-600">
                    No robots found.
                  </div>

                ) : (

                  robots.map((robot) => (

                    <div
                      key={robot.robot_id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-lg">
                          🤖
                        </div>

                        <div>

                          <p className="text-sm font-medium">
                            {robot.robot_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            RBT-
                            {String(
                              robot.robot_id
                            ).padStart(3, "0")}
                          </p>

                        </div>

                      </div>

                      <div className="text-xs text-slate-500">

                        Position{" "}

                        <span className="font-mono text-slate-300">

                          [
                          {robot.position
                            .map((value) =>
                              Number(value).toFixed(1)
                            )
                            .join(", ")}
                          ]

                        </span>

                      </div>

                      <div className="flex items-center gap-3">

                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            robot.status === "IDLE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          ● {robot.status}
                        </span>

                        <button
                          onClick={() =>
                            openRobotControl(robot)
                          }
                          className="rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-1.5 text-[10px] font-medium text-blue-400 transition hover:border-blue-700 hover:bg-blue-900/30"
                        >
                          Control
                        </button>

                      </div>

                    </div>

                  ))

                )}

              </div>

            </div>

            {/* AI Diagnostics */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121c]">

              <div className="border-b border-slate-800 px-5 py-4">

                <h3 className="font-semibold">
                  AI Diagnostics
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Execution anomaly detection
                </p>

              </div>

              <div className="p-5">

                <div
                  className={`rounded-lg border p-4 ${
                    aiAnalysis?.status === "ANALYZED" &&
                    aiAnalysis.anomaly_count &&
                    aiAnalysis.anomaly_count > 0
                      ? "border-amber-900/50 bg-amber-950/20"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        aiAnalysis?.status === "ANALYZED" &&
                        aiAnalysis.anomaly_count &&
                        aiAnalysis.anomaly_count > 0
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      !
                    </div>

                    <div>

                      <p
                        className={`text-sm font-medium ${aiStatusClass}`}
                      >
                        AI Analysis
                      </p>

                      <p className="text-xs text-slate-500">
                        Execution-time analysis
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 border-t border-slate-800 pt-4">

                    <div className="flex justify-between text-xs">

                      <span className="text-slate-500">
                        Current status
                      </span>

                      <span
                        className={`font-medium ${aiStatusClass}`}
                      >
                        {aiStatus}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-lg bg-slate-900 p-3">

                    <p className="text-[10px] uppercase text-slate-600">
                      Records
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {aiAnalysis?.total_records ??
                        "—"}
                    </p>

                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">

                    <p className="text-[10px] uppercase text-slate-600">
                      Anomalies
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {aiAnalysis?.anomaly_count ??
                        "—"}
                    </p>

                  </div>

                </div>

                <div className="mt-3 rounded-lg bg-slate-900 p-3">

                  <p className="text-[10px] uppercase text-slate-600">
                    Model
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Isolation Forest
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Execution Performance */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c121c]">

            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">

              <div>
                <h3 className="font-semibold">Execution Performance</h3>
                <p className="mt-0.5 text-xs text-slate-500">Runtime, throughput and execution efficiency</p>
              </div>

              <span className="rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[10px] font-medium text-blue-400">
                Live Job Metrics
              </span>

            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Average Runtime", `${averageRuntime.toFixed(3)}s`, "Across loaded jobs"],
                ["Fastest Job", `${fastestRuntime.toFixed(3)}s`, "Minimum runtime"],
                ["Slowest Job", `${slowestRuntime.toFixed(3)}s`, "Maximum runtime"],
                ["Total Attempts", `${totalAttempts}`, "Execution attempts"],
                ["Completion Rate", `${jobs.length ? ((completedJobs.length / jobs.length) * 100).toFixed(1) : "0.0"}%`, `${failedJobs.length} failed`],
              ].map(([label, value, subtext]) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-[#080e17] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-100">{value}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{subtext}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Recent Runtime Profile</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">Latest six automation executions</p>
                </div>
                <span className="font-mono text-[10px] text-slate-600">{performanceJobs.length} jobs</span>
              </div>

              <div className="space-y-3">
                {performanceJobs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-600">No execution data available.</p>
                ) : (
                  performanceJobs.map((job) => {
                    const runtime = Number(job.execution_time) || 0;
                    const width = Math.max((runtime / maxPerformanceRuntime) * 100, 3);

                    return (
                      <div key={`performance-${job.job_id}`} className="grid grid-cols-[130px_1fr_65px] items-center gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs text-slate-300">{job.job_name}</p>
                          <p className="font-mono text-[9px] text-slate-600">JOB-{job.job_id}</p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <p className="text-right font-mono text-[10px] text-slate-400">{runtime.toFixed(3)}s</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Jobs */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c121c]">

            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">

              <div>

                <h3 className="font-semibold">
                  Recent Automation Jobs
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Live workflow execution and recovery activity
                </p>

              </div>

              <button className="text-xs font-medium text-blue-400 hover:text-blue-300">
                View all jobs →
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead>

                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">

                    <th className="px-5 py-3 font-medium">
                      Job
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Priority
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Attempts
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Runtime
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {jobs.length === 0 ? (

                    <tr>

                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-slate-600"
                      >
                        No automation jobs found.
                      </td>

                    </tr>

                  ) : (

                    jobs.map((job) => (

                      <tr
                        key={job.job_id}
                        className="transition hover:bg-slate-900/40"
                      >

                        <td className="px-5 py-4">

                          <p className="text-sm font-medium">
                            {job.job_name}
                          </p>

                          <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                            JOB-{job.job_id}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-xs text-slate-400">
                            {job.priority}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              job.status ===
                              "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {job.status}
                          </span>

                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          {job.attempts}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          {job.execution_time}s
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* Failure Recovery & Retry */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c121c]">

            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">

              <div>
                <h3 className="font-semibold">
                  Failure Recovery & Retry
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Live retry activity and workflow recovery status
                </p>
              </div>

              <div className="rounded-full border border-blue-900/50 bg-blue-950/20 px-3 py-1.5 text-[10px] font-medium text-blue-400">
                Recovery Engine Active
              </div>

            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-3">

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Retried Jobs
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {
                    jobs.filter(
                      (job) => job.attempts > 1
                    ).length
                  }
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Jobs requiring additional attempts
                </p>

              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Recovered
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {
                    jobs.filter(
                      (job) =>
                        job.attempts > 1 &&
                        job.status === "COMPLETED"
                    ).length
                  }
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Retried jobs completed successfully
                </p>

              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Recovery Rate
                </p>

                <p className="mt-2 text-2xl font-semibold text-blue-400">
                  {(() => {
                    const retried = jobs.filter(
                      (job) => job.attempts > 1
                    );

                    const recovered = retried.filter(
                      (job) =>
                        job.status === "COMPLETED"
                    );

                    return retried.length > 0
                      ? `${(
                          (recovered.length /
                            retried.length) *
                          100
                        ).toFixed(0)}%`
                      : "—";
                  })()}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Successful recovery after retry
                </p>

              </div>

            </div>

            <div className="border-t border-slate-800">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px] text-left">

                  <thead>

                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">

                      <th className="px-5 py-3 font-medium">
                        Job
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Attempts
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Recovery
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Runtime
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-800">

                    {jobs.filter(
                      (job) => job.attempts > 1
                    ).length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm text-slate-600"
                        >
                          No retry activity detected.
                        </td>

                      </tr>

                    ) : (

                      jobs
                        .filter(
                          (job) => job.attempts > 1
                        )
                        .slice(0, 10)
                        .map((job) => (

                          <tr
                            key={`recovery-${job.job_id}`}
                            className="transition hover:bg-slate-900/40"
                          >

                            <td className="px-5 py-4">

                              <p className="text-sm font-medium">
                                {job.job_name}
                              </p>

                              <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                                JOB-{job.job_id}
                              </p>

                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  job.status ===
                                  "COMPLETED"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {job.status}
                              </span>

                            </td>

                            <td className="px-5 py-4">

                              <span className="font-mono text-xs text-amber-300">
                                {job.attempts} attempts
                              </span>

                            </td>

                            <td className="px-5 py-4">

                              {job.status ===
                              "COMPLETED" ? (

                                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">

                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                                    ✓
                                  </span>

                                  Recovered

                                </div>

                              ) : (

                                <div className="flex items-center gap-2 text-xs font-medium text-red-400">

                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10">
                                    !
                                  </span>

                                  Recovery Required

                                </div>

                              )}

                            </td>

                            <td className="px-5 py-4 font-mono text-xs text-slate-400">
                              {job.execution_time}s
                            </td>

                          </tr>

                        ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

          {/* Live Testing */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c121c]">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">Live Test Execution</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Execute the automated test suite and view live results
                </p>
              </div>

              <button
                onClick={runTestSuite}
                disabled={runningTests}
                className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {runningTests ? "Running Tests..." : "Run Test Suite"}
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </p>
                <p
                  className={`mt-2 text-lg font-semibold ${
                    testResults?.status === "PASSED"
                      ? "text-emerald-400"
                      : testResults?.status === "FAILED"
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {testResults?.status ?? "Not Run"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Total
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {testResults?.total_tests ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Passed
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-400">
                  {testResults?.passed ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Failed
                </p>
                <p className="mt-2 text-lg font-semibold text-red-400">
                  {testResults?.failed ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Warnings
                </p>
                <p className="mt-2 text-lg font-semibold text-amber-300">
                  {testResults?.warnings ?? "—"}
                </p>
              </div>
            </div>

            {testResults && (
              <>
                <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
                  {testResults.skipped} skipped • Exit code {testResults.exit_code}
                </div>

                <div className="border-t border-slate-800">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Test Case Results
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Individual automated verification results
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1.5 text-[10px] font-medium text-emerald-400">
                      {testResults.tests.length} Tests
                    </span>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    <div className="divide-y divide-slate-800">
                      {testResults.tests.map((test, index) => {
                        const testName = test.name
                          .replace(/^testing\//, "")
                          .replace(/\.py::/g, " → ");

                        const passed = test.status === "PASSED";
                        const skipped = test.status === "SKIPPED";

                        return (
                          <div
                            key={`${test.name}-${index}`}
                            className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-900/40"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-xs text-slate-300">
                                {testName}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                passed
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : skipped
                                  ? "bg-amber-500/10 text-amber-300"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {test.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Robotics Simulation */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c121c]">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">Robotics Simulation</h3>
                <p className="mt-0.5 text-xs text-slate-500">Virtual robot movement and collision validation</p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${simulationStatus?.simulation === "Running" ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-400" : "border-slate-700 bg-slate-900 text-slate-500"}`}>
                ● {simulationStatus?.simulation ?? "Checking..."}
              </span>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Robot Position</p>
                <p className="mt-2 font-mono text-lg text-slate-200">
                  [{simulationStatus?.robot_position?.map((value) => Number(value).toFixed(1)).join(", ") ?? "—"}]
                </p>
                <p className="mt-1 text-[10px] text-slate-500">Safety distance: {simulationStatus?.safety_distance ?? "—"}</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Virtual Obstacles</p>
                <div className="mt-2 space-y-1.5">
                  {simulationStatus?.obstacles?.map((obstacle) => (
                    <div key={obstacle.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{obstacle.name}</span>
                      <span className="font-mono text-slate-500">[{obstacle.position.join(", ")}]</span>
                    </div>
                  )) ?? <span className="text-xs text-slate-600">Loading...</span>}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#080d15] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Latest Movement</p>
                <p className={`mt-2 text-lg font-semibold ${simulationMove?.collision?.collision ? "text-red-400" : simulationMove?.status === "MOVED" ? "text-emerald-400" : "text-slate-400"}`}>
                  {simulationMove?.status ?? "No movement"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {simulationMove ? `${simulationMove.distance.toFixed(3)} units • ${simulationMove.collision.collision ? simulationMove.collision.obstacle + " detected" : "Path clear"}` : "Run a simulation movement"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 px-5 py-4">
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-medium text-slate-300">Navigation Visualization</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">Top-down X/Y safety view • Z coordinate is retained by the simulator</p>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Robot</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Target</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Obstacle</span>
                </div>
              </div>

              {(() => {
                const robotPoint = simulationPoint(simulationStatus?.robot_position);
                const targetPosition = [Number(simulationX), Number(simulationY), Number(simulationZ)];
                const hasTarget = [simulationX, simulationY, simulationZ].every((value) => value.trim() !== "") && targetPosition.every(Number.isFinite);
                const targetPoint = hasTarget ? simulationPoint(targetPosition) : null;
                const collision = Boolean(simulationMove?.collision?.collision);

                return (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#070c14]">
                      <svg viewBox="0 0 600 320" className="h-[260px] w-full sm:h-[300px]" role="img" aria-label="Robotics simulation navigation map">
                        <defs>
                          <pattern id="simulation-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(71,85,105,0.22)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect x="0" y="0" width="600" height="320" fill="url(#simulation-grid)" />
                        <rect x="28" y="28" width="544" height="264" rx="12" fill="none" stroke="rgba(51,65,85,0.8)" />

                        <text x="30" y="18" fill="#64748b" fontSize="10">Y ↑</text>
                        <text x="550" y="312" fill="#64748b" fontSize="10">X →</text>

                        {[0, 1, 2, 3, 4, 5].map((tick) => {
                          const point = simulationPoint([tick, 0, 0]);
                          return point ? (
                            <text key={`x-${tick}`} x={point.x} y="308" textAnchor="middle" fill="#475569" fontSize="9">{tick}</text>
                          ) : null;
                        })}
                        {[0, 1, 2, 3, 4, 5].map((tick) => {
                          const point = simulationPoint([0, tick, 0]);
                          return point ? (
                            <text key={`y-${tick}`} x="16" y={point.y + 3} textAnchor="middle" fill="#475569" fontSize="9">{tick}</text>
                          ) : null;
                        })}

                        {simulationStatus?.obstacles?.map((obstacle) => {
                          const point = simulationPoint(obstacle.position);
                          if (!point) return null;
                          return (
                            <g key={obstacle.name}>
                              <circle cx={point.x} cy={point.y} r={simulationRadius(obstacle.radius + (simulationStatus.safety_distance || 0))} fill="rgba(248,113,113,0.06)" stroke="rgba(248,113,113,0.25)" strokeDasharray="5 5" />
                              <circle cx={point.x} cy={point.y} r={simulationRadius(obstacle.radius)} fill="rgba(248,113,113,0.18)" stroke="#f87171" strokeWidth="1.5" />
                              <text x={point.x} y={point.y - simulationRadius(obstacle.radius) - 7} textAnchor="middle" fill="#fca5a5" fontSize="9">{obstacle.name}</text>
                            </g>
                          );
                        })}

                        {robotPoint && targetPoint && (
                          <line
                            x1={robotPoint.x}
                            y1={robotPoint.y}
                            x2={targetPoint.x}
                            y2={targetPoint.y}
                            stroke={collision ? "#f87171" : "#60a5fa"}
                            strokeWidth="2"
                            strokeDasharray="7 6"
                            opacity="0.9"
                          />
                        )}

                        {targetPoint && (
                          <g>
                            <circle cx={targetPoint.x} cy={targetPoint.y} r="10" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" strokeWidth="1.5" />
                            <path d={`M ${targetPoint.x - 5} ${targetPoint.y} L ${targetPoint.x + 5} ${targetPoint.y} M ${targetPoint.x} ${targetPoint.y - 5} L ${targetPoint.x} ${targetPoint.y + 5}`} stroke="#93c5fd" strokeWidth="1.5" />
                            <text x={targetPoint.x + 14} y={targetPoint.y - 8} fill="#93c5fd" fontSize="9">Target</text>
                          </g>
                        )}

                        {robotPoint && (
                          <g>
                            <circle cx={robotPoint.x} cy={robotPoint.y} r="15" fill={collision ? "rgba(248,113,113,0.16)" : "rgba(52,211,153,0.14)"} />
                            <circle cx={robotPoint.x} cy={robotPoint.y} r="8" fill={collision ? "#f87171" : "#34d399"} />
                            <circle cx={robotPoint.x} cy={robotPoint.y} r="12" fill="none" stroke={collision ? "#f87171" : "#34d399"} strokeWidth="1.2" opacity="0.7" />
                            <text x={robotPoint.x + 15} y={robotPoint.y + 4} fill={collision ? "#fca5a5" : "#6ee7b7"} fontSize="9">Robot</text>
                          </g>
                        )}
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                      <div className="rounded-lg border border-slate-800 bg-[#080d15] p-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">Current Position</p>
                        <p className="mt-1 font-mono text-xs text-slate-200">
                          [{simulationStatus?.robot_position?.map((value) => Number(value).toFixed(1)).join(", ") ?? "—"}]
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-[#080d15] p-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">Target Position</p>
                        <p className="mt-1 font-mono text-xs text-slate-200">
                          {hasTarget ? `[${targetPosition.map((value) => value.toFixed(1)).join(", ")}]` : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-[#080d15] p-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">Path Status</p>
                        <p className={`mt-1 text-xs font-semibold ${collision ? "text-red-400" : targetPoint ? "text-blue-400" : "text-slate-500"}`}>
                          {collision ? "COLLISION DETECTED" : targetPoint ? "PATH PREVIEW" : "AWAITING TARGET"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-[#080d15] p-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">Movement Distance</p>
                        <p className="mt-1 font-mono text-xs text-slate-200">
                          {simulationMove ? `${simulationMove.distance.toFixed(3)} units` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="border-t border-slate-800 px-5 py-4">
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-300">Simulation Movement</p>
                <p className="mt-0.5 text-[10px] text-slate-600">Set a target coordinate and validate the path</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input type="number" step="0.1" value={simulationX} onChange={(event) => setSimulationX(event.target.value)} placeholder="X" className="rounded-lg border border-slate-700 bg-[#080d15] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500" />
                <input type="number" step="0.1" value={simulationY} onChange={(event) => setSimulationY(event.target.value)} placeholder="Y" className="rounded-lg border border-slate-700 bg-[#080d15] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500" />
                <input type="number" step="0.1" value={simulationZ} onChange={(event) => setSimulationZ(event.target.value)} placeholder="Z" className="rounded-lg border border-slate-700 bg-[#080d15] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500" />
                <button onClick={moveSimulationRobot} disabled={movingSimulation} className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {movingSimulation ? "Simulating..." : "Move Robot"}
                </button>
              </div>
              {simulationMove?.message && (
                <div className={`mt-3 rounded-lg border px-4 py-2.5 text-xs ${simulationMove.collision?.collision ? "border-red-900/60 bg-red-950/20 text-red-400" : "border-emerald-900/60 bg-emerald-950/20 text-emerald-400"}`}>
                  {simulationMove.message}
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {[
              ["FastAPI", systemHealth?.fastapi ?? "Checking..."],
              ["PostgreSQL", systemHealth?.postgresql ?? "Checking..."],
              [
                "Automation Engine",
                systemHealth?.automation_engine ?? "Checking...",
              ],
              [
                "Test Suite",
                testResults
                  ? `${testResults.passed} Passed`
                  : "Not Run",
              ],
            ].map(([name, status]) => (

              <div
                key={name}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0c121c] px-4 py-3"
              >

                <span className="text-xs text-slate-500">
                  {name}
                </span>

                <span
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    status === "Healthy" ||
                    status === "Connected" ||
                    status === "Running" ||
                    (name === "Test Suite" && testResults?.status === "PASSED")
                      ? "text-emerald-400"
                      : status === "Checking..." || status === "Not Run"
                      ? "text-slate-400"
                      : "text-red-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === "Healthy" ||
                      status === "Connected" ||
                      status === "Running" ||
                      (name === "Test Suite" && testResults?.status === "PASSED")
                        ? "bg-emerald-400"
                        : status === "Checking..." || status === "Not Run"
                        ? "bg-slate-500"
                        : "bg-red-400"
                    }`}
                  />
                  {status}
                </span>

              </div>

            ))}

          </div>

          <footer className="mt-8 border-t border-slate-800 pt-5 text-center text-[10px] uppercase tracking-wider text-slate-600">
            Intelligent Automation Platform • Development Environment
          </footer>

        </section>

      </div>

      {/* Create Automation Modal */}
      {showCreateModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => {
            if (!creatingJob) {
              setShowCreateModal(false);
              setCreateMessage("");
            }
          }}
        >

          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c121c] p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                  Automation
                </p>

                <h3 className="mt-1 text-xl font-semibold">
                  Create Automation
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Configure and execute a new automation job.
                </p>

              </div>

              <button
                onClick={() => {
                  if (!creatingJob) {
                    setShowCreateModal(false);
                    setCreateMessage("");
                  }
                }}
                className="text-xl text-slate-500 transition hover:text-slate-200"
              >
                ×
              </button>

            </div>

            {/* Job Name */}
            <div className="mb-5">

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Job Name
              </label>

              <input
                type="text"
                value={jobName}
                onChange={(event) =>
                  setJobName(event.target.value)
                }
                placeholder="e.g. Component Inspection"
                disabled={creatingJob}
                className="w-full rounded-lg border border-slate-700 bg-[#080d15] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

            </div>

            {/* Priority */}
            <div className="mb-6">

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                disabled={creatingJob}
                className="w-full rounded-lg border border-slate-700 bg-[#080d15] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
              >

                <option value="LOW">
                  LOW
                </option>

                <option value="MEDIUM">
                  MEDIUM
                </option>

                <option value="HIGH">
                  HIGH
                </option>

              </select>

            </div>

            {/* Message */}
            {createMessage && (

              <div
                className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                  createMessage.includes(
                    "successfully"
                  )
                    ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
                    : "border-red-900/60 bg-red-950/30 text-red-400"
                }`}
              >
                {createMessage}
              </div>

            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">

              <button
                onClick={() => {
                  if (!creatingJob) {
                    setShowCreateModal(false);
                    setCreateMessage("");
                  }
                }}
                disabled={creatingJob}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={createAutomation}
                disabled={creatingJob}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingJob
                  ? "Creating..."
                  : "Create Automation"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Robot Control Modal */}
      {selectedRobot && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => {
            if (
              !movingRobot &&
              !inspectingRobot
            ) {
              closeRobotControl();
            }
          }}
        >

          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c121c] p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Header */}
            <div className="mb-6 flex items-start justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                  Robotics Control
                </p>

                <h3 className="mt-1 text-xl font-semibold">
                  {selectedRobot.robot_name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  RBT-
                  {String(
                    selectedRobot.robot_id
                  ).padStart(3, "0")}{" "}
                  • Position control
                </p>

              </div>

              <button
                onClick={closeRobotControl}
                disabled={
                  movingRobot ||
                  inspectingRobot
                }
                className="text-xl text-slate-500 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* Current Position */}
            <div className="mb-5 rounded-lg border border-slate-800 bg-[#080d15] p-4">

              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Current Position
              </p>

              <p className="mt-2 font-mono text-sm text-slate-300">

                [
                {selectedRobot.position
                  .map((value) =>
                    Number(value).toFixed(1)
                  )
                  .join(", ")}
                ]

              </p>

            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-3 gap-3">

              <div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  X
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={robotX}
                  onChange={(event) =>
                    setRobotX(
                      event.target.value
                    )
                  }
                  disabled={
                    movingRobot ||
                    inspectingRobot
                  }
                  className="w-full rounded-lg border border-slate-700 bg-[#080d15] px-3 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Y
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={robotY}
                  onChange={(event) =>
                    setRobotY(
                      event.target.value
                    )
                  }
                  disabled={
                    movingRobot ||
                    inspectingRobot
                  }
                  className="w-full rounded-lg border border-slate-700 bg-[#080d15] px-3 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Z
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={robotZ}
                  onChange={(event) =>
                    setRobotZ(
                      event.target.value
                    )
                  }
                  disabled={
                    movingRobot ||
                    inspectingRobot
                  }
                  className="w-full rounded-lg border border-slate-700 bg-[#080d15] px-3 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
                />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-600">
              Movement is validated by the collision detection system before execution.
            </p>

            {/* Robot Message */}
            {robotMessage && (

              <div
                className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
                  robotMessage.includes(
                    "successfully"
                  ) ||
                  robotMessage.includes(
                    "completed"
                  )
                    ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
                    : "border-red-900/60 bg-red-950/30 text-red-400"
                }`}
              >
                {robotMessage}
              </div>

            )}

            {/* Controls */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

              <button
                onClick={moveRobot}
                disabled={
                  movingRobot ||
                  inspectingRobot
                }
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {movingRobot
                  ? "Moving..."
                  : "Execute Movement"}
              </button>

              <button
                onClick={inspectRobot}
                disabled={
                  movingRobot ||
                  inspectingRobot
                }
                className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:border-amber-700 hover:bg-amber-900/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inspectingRobot
                  ? "Inspecting..."
                  : "Inspect Robot"}
              </button>

              <button
                onClick={loadRobotHistory}
                disabled={
                  movingRobot ||
                  inspectingRobot ||
                  historyLoading
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {historyLoading
                  ? "Loading..."
                  : "View History"}
              </button>

            </div>

            <button
              onClick={closeRobotControl}
              disabled={
                movingRobot ||
                inspectingRobot
              }
              className="mt-3 w-full rounded-lg border border-slate-800 px-4 py-2 text-xs text-slate-500 transition hover:bg-slate-900 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close Control Panel
            </button>

          </div>

        </div>

      )}

      {/* Robot History Modal */}
      {showHistory && selectedRobot && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() =>
            setShowHistory(false)
          }
        >

          <div
            className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#0c121c] p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* History Header */}
            <div className="mb-5 flex items-start justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                  Robotics Audit
                </p>

                <h3 className="mt-1 text-xl font-semibold">
                  {selectedRobot.robot_name} History
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Movement and inspection events recorded by the backend.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowHistory(false)
                }
                className="text-xl text-slate-500 transition hover:text-slate-200"
              >
                ×
              </button>

            </div>

            {/* History List */}
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-800">

              {robotHistory.length === 0 ? (

                <div className="px-5 py-10 text-center text-sm text-slate-600">
                  No history events found for this robot.
                </div>

              ) : (

                <div className="divide-y divide-slate-800">

                  {robotHistory.map(
                    (event, index) => (

                      <div
                        key={`${event.created_at}-${index}`}
                        className="p-4"
                      >

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400">
                                {event.operation}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  event.status ===
                                    "SUCCESS" ||
                                  event.status ===
                                    "COMPLETED"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : event.status ===
                                      "REJECTED"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {event.status}
                              </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-300">
                              {event.message ||
                                "No event message available."}
                            </p>

                          </div>

                          <div className="text-left sm:text-right">

                            <p className="font-mono text-xs text-slate-500">

                              [
                              {event.position
                                .map(
                                  (
                                    value
                                  ) =>
                                    value ===
                                      null ||
                                    value ===
                                      undefined
                                      ? "—"
                                      : Number(
                                          value
                                        ).toFixed(
                                          1
                                        )
                                )
                                .join(
                                  ", "
                                )}
                              ]

                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              {new Date(
                                event.created_at
                              ).toLocaleString()}
                            </p>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {/* History Footer */}
            <div className="mt-5 flex items-center justify-between">

              <p className="text-xs text-slate-600">
                {robotHistory.length} event
                {robotHistory.length === 1
                  ? ""
                  : "s"} recorded
              </p>

              <button
                onClick={() =>
                  setShowHistory(false)
                }
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}