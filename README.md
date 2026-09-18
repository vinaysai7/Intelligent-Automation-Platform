Intelligent Automation Platform

An end-to-end automation platform combining workflow automation, failure recovery, AI-based anomaly detection, robotics simulation, collision validation, automated testing, and a web dashboard.

Overview

The Intelligent Automation Platform provides a single control center for monitoring and validating automation workflows. It combines a Python/FastAPI backend, PostgreSQL persistence, AI anomaly detection, robotics simulation, automated tests, and a Next.js dashboard.

Key Features

Automation Workflow Engine

Create and execute automation jobs.

Track job status, priority, attempts, and runtime.

Persist job activity in PostgreSQL.

Failure Recovery & Retry

Retry failed workflow operations when recovery is required.

Track retry attempts and recovery status.

Display recovered jobs and recovery metrics in the dashboard.

AI Anomaly Detection

Uses Isolation Forest for execution-time anomaly detection.

Displays records analyzed and detected anomalies.

Integrates AI diagnostics into the operations dashboard.

Robotics Fleet

Monitor multiple virtual robots.

View robot positions and status.

Perform robot movement and inspection operations.

Robotics Simulation

Pure-Python virtual robot simulation.

Coordinate-based X/Y/Z movement.

Virtual obstacles and configurable safety distance.

Safe movement validation.

Collision detection and movement rejection.

Top-down navigation visualization showing robot, target, obstacles, and path status.

Automated Testing

PyTest-based automated verification.

Dashboard-triggered test execution.

Individual test-case results are displayed live.

Monitoring

Job execution metrics.

Average, fastest, and slowest runtime.

Total attempts and completion rate.

Recent runtime profile.

Operations Dashboard

Centralized system health and automation monitoring.

FastAPI, PostgreSQL, Automation Engine, and Test Suite status.

Responsive dark operations-center interface.

Technology Stack

Backend

Python

FastAPI

Uvicorn

PostgreSQL

psycopg2-binary

AI / Analytics

scikit-learn

Isolation Forest

Robotics

Pure-Python robotics simulation

Coordinate-based navigation

Collision and safety-distance validation

Testing

PyTest

HTTPX

Frontend

Next.js

React

TypeScript

Tailwind CSS

High-Level Architecture

                    ┌──────────────────────────┐
                    │     Next.js Dashboard    │
                    │  Operations Control UI   │
                    └────────────┬─────────────┘
                                 │ HTTP
                                 ▼
                    ┌──────────────────────────┐
                    │      FastAPI Backend     │
                    │      REST API Layer      │
                    └──────┬─────┬─────┬───────┘
                           │     │     │
              ┌────────────┘     │     └──────────────┐
              ▼                  ▼                    ▼
       ┌─────────────┐   ┌──────────────┐    ┌──────────────┐
       │ Automation  │   │ AI Anomaly   │    │   Robotics   │
       │   Engine    │   │  Detection   │    │  Simulation  │
       └──────┬──────┘   └──────────────┘    └──────┬───────┘
              │                                     │
              ▼                                     ▼
       ┌─────────────┐                      ┌──────────────┐
       │ Retry /     │                      │ Collision &  │
       │ Recovery    │                      │ Safety Check │
       └──────┬──────┘                      └──────────────┘
              │
              ▼
       ┌─────────────────┐
       │   PostgreSQL    │
       │ Jobs / History  │
       └─────────────────┘

                    ┌──────────────────────────┐
                    │     PyTest Test Suite    │
                    │ API / AI / Monitoring /  │
                    │ Recovery / Robotics     │
                    └──────────────────────────┘

Project Structure

Intelligent-Automation-Platform/
│
├── api/
│   ├── app.py
│   └── routes.py
│
├── automation_engine/
│   └── workflow.py
│
├── robotics/
│   └── simulation.py
│
├── database/
│   └── ...
│
├── tests/
│   └── ...
│
├── dashboard/
│   ├── app/
│   │   └── page.tsx
│   └── ...
│
├── venv/
└── README.md

Local Setup

1. Clone the repository

git clone https://github.com/saibandela/Intelligent-Automation-Platform.git
cd Intelligent-Automation-Platform

If the repository name is different on GitHub, replace the repository URL with your actual repository URL.

2. Create and activate the Python environment

Windows PowerShell:

python -m venv venv
.\venv\Scripts\Activate.ps1

Install the backend dependencies:

pip install -r requirements.txt

3. Configure PostgreSQL

Create the application database:

CREATE DATABASE automation_platform;

Configure the database connection using the project's database configuration.

4. Start the FastAPI backend

From the project root:

uvicorn api.app:app --reload

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

Health check:

http://127.0.0.1:8000/health

5. Start the dashboard

Open a second terminal:

cd dashboard
npm install
npm run dev

Dashboard:

http://localhost:3000

Important API Endpoints

Endpoint

Method

Purpose

/health

GET

Basic API health check

/system/health

GET

FastAPI, PostgreSQL and automation engine health

/jobs

GET

Retrieve automation jobs

/jobs

POST

Create an automation job

/monitoring/metrics

GET

Execution metrics

/ai/anomalies

GET

AI anomaly analysis

/robots/{robot_id}/move

POST

Move a virtual robot

/robots/{robot_id}/inspect

POST

Inspect a robot

/robots/{robot_id}/history

GET

Robot history

/robots/simulation/status

GET

Simulation state

/robots/simulation/move

POST

Move simulation robot

/testing/run

POST

Execute automated test suite

Robotics Simulation

The simulation uses coordinate-based movement and virtual obstacles.

Example safe movement:

Start:  [0, 0, 0]
Target: [1, 1, 1]

Result: MOVED
Distance: 1.732 units
Path: Clear

Example collision validation:

Start:  [0, 0, 0]
Target: [2, 2, 2]

Result: MOVEMENT_REJECTED
Obstacle: Obstacle-1
Path: Collision Detected

The dashboard visualizes the robot position, target, obstacles, safety zones, and path status.

Automated Test Results

The integrated dashboard test runner was validated with:

Status:    PASSED
Total:     19
Passed:    19
Failed:     0
Skipped:    0
Warnings:   1
Exit Code:  0

The warning is reported separately from the test failures.

Validation Completed

The platform has been manually validated for:

Automation job creation and completion

Job monitoring and runtime metrics

AI anomaly detection

Retry and recovery reporting

Robotics movement

Collision rejection

Robotics navigation visualization

Automated test execution

FastAPI health

PostgreSQL connectivity

Dashboard system-health reporting

Future Improvements

Real-time WebSocket updates

Persistent multi-robot simulation state

3D robotics visualization

Additional anomaly-detection models

Authentication and role-based access

Containerized deployment

CI/CD integration

Cloud deployment

Expanded industrial automation integrations

Portfolio Highlights

This project demonstrates practical experience with:

Python • FastAPI • REST APIs • PostgreSQL • SQL • Machine Learning • Isolation Forest • Automation Workflows • Retry/Recovery • Robotics Simulation • Collision Detection • PyTest • HTTPX • Next.js • React • TypeScript • Tailwind CSS

License

Add the license you intend to use for the repository.