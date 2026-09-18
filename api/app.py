from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router


app = FastAPI(
    title="Intelligent Automation Platform",
    version="1.0.0",
    description="Automation, AI, Robotics and Testing Platform",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Intelligent Automation Platform API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
