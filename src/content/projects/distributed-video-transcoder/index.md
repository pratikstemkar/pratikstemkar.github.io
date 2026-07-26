---
title: "Distributed Video Transcoder"
description: "Asynchronous video transcoding with a Redis-backed job queue, ASP.NET Core, SQL Server, and FFmpeg"
date: "Jul 2026"
repoURL: "https://github.com/pratikstemkar/distributed-video-transcoder"
technologies: ["ASP.NET Core", "C#", "Redis", "SQL Server", "FFmpeg", "Entity Framework Core", "Docker"]
---

A backend-focused portfolio project demonstrating **asynchronous video transcoding** with a queue-based architecture. The API accepts video uploads, persists metadata to SQL Server, and enqueues job IDs to a Redis list. A separate worker process dequeues jobs via `BRPOP`, runs FFmpeg to transcode to 720p, and updates job status in the database.

**Tech Stack:** ASP.NET Core 10 (C#), SQL Server 2022, Redis 7, FFmpeg, Entity Framework Core, Serilog, Docker Compose, Vue.js 3 (frontend).

**Basic Flow:**

1. Client uploads a video file to the API
2. API persists video + job metadata to SQL Server and writes the file to disk
3. API enqueues the job ID into a Redis FIFO list (`transcode:queue`)
4. One of the worker processes dequeues the job from Redis, acquires a distributed lock, and spawns FFmpeg to transcode to 720p
5. On completion, the worker updates the job status in SQL Server; on failure, the job is retried with exponential backoff or sent to a Dead Letter Queue (DLQ)
6. Client polls the job status endpoint to track progress and downloads the output when ready

## Distributed System Concepts

| Concept | Implementation |
|---|---|
| **Job Queue (Producer-Consumer)** | Redis List (`LPUSH` / `RPOP`) decouples the API (producer) from workers (consumers). Jobs are processed FIFO. |
| **Horizontal Scaling** | Multiple worker instances (`worker-1`, `worker-2`, `worker-3`) compete on the same Redis queue. Adding workers increases throughput linearly. |
| **Distributed Locking** | Redis `SET NX EX` ensures a job is processed by exactly one worker, preventing duplicate transcoding. Locks have a 5-minute TTL. |
| **Dead Letter Queue (DLQ)** | Jobs that exhaust retries are moved to a Redis-backed DLQ. The API exposes endpoints to inspect and retry failed jobs. |
| **Retry with Exponential Backoff** | Failed jobs are retried up to 3 times with increasing delays: 10s → 20s → 40s. Scheduled retries use a Redis Sorted Set keyed by `NextRetryAt` timestamp. |
| **Worker Health Monitoring** | Each worker writes a heartbeat to a Redis Hash every 5 seconds (TTL 35s). The API exposes a `/api/jobs/workers` endpoint showing all active workers and their health status. |
| **Stale Job Recovery** | Every 30 seconds, a worker scans the database for jobs stuck in `Processing` state (older than 60s). If the lock has expired in Redis, the job is reset to `Queued` and re-enqueued. |
| **Idempotency** | Before running FFmpeg, the worker checks if the output file already exists. If so, transcoding is skipped and the job is marked complete — safe for at-least-once delivery. |
| **Clean Architecture** | The codebase follows Onion/Clean Architecture with four layers: Domain (entities, enums) → Application (interfaces, DTOs, use cases) → Infrastructure (EF Core, Redis, FFmpeg) → Presentation (API controllers, middleware). |
| **Repository + Unit of Work** | Data access is abstracted behind repository interfaces with a Unit of Work for transactional consistency across repositories. |
| **Health Checks** | Each service has a `/healthz` endpoint. Docker Compose uses `depends_on` with `condition: service_healthy` to enforce startup ordering. |
| **Structured Logging** | Serilog enriches all log entries with context (worker ID, job ID) and outputs structured JSON for observability. |
