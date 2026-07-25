---
title: "Distributed Video Transcoder"
description: "Asynchronous video transcoding with a Redis-backed job queue, ASP.NET Core, SQL Server, and FFmpeg"
date: "Jul 2026"
repoURL: "https://github.com/pratikstemkar/distributed-video-transcoder"
technologies: ["ASP.NET Core", "C#", "Redis", "SQL Server", "FFmpeg", "Entity Framework Core", "Docker"]
---

A backend-focused portfolio project demonstrating **asynchronous video transcoding** with a queue-based architecture. The API accepts video uploads, persists metadata to SQL Server, and enqueues job IDs to a Redis list. A separate worker process dequeues jobs via `BRPOP`, runs FFmpeg to transcode to 720p, and updates job status in the database.

### Architecture

```
Client ──► API (:5000) ──► SQL Server (:1433)
                │
                ▼
           Redis (:6379) ──► Worker ──► FFmpeg ──► /data/output
```

### Highlights

- Clean architecture with separate API, Application, Domain, Infrastructure, and Worker projects
- Job lifecycle: `Queued` → `Processing` → `Completed` or `Failed`
- REST API for upload, job status, and video metadata
- Structured logging with Serilog, health checks, and OpenAPI documentation
- Docker Compose setup with health checks and service dependencies
