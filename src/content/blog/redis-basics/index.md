---
title: "Redis Basics"
description: "Why It Shows Up Everywhere"
date: "March 13, 2026"
tags: ["database", "redis", "caching", "redis-internals", "database-internals"]
visible: true
---

If you work on backend systems long enough, Redis eventually shows up in your architecture.

It usually starts as a cache. Then someone uses it for rate limiting. Later it appears in leaderboards, queues, or session storage. Before long Redis is handling a surprising amount of real time logic in the system.

That is what made me dig deeper into it while studying distributed systems. Redis keeps appearing in system designs because it solves one very specific problem extremely well: **extremely fast data access**.

Understanding what Redis actually is and why it is designed the way it is makes it much easier to use it correctly in system architecture.

## What Redis Actually Is

Redis stands for **Remote Dictionary Server**. At its core, Redis is an **in memory key value data store**.

Unlike traditional databases that primarily store data on disk, Redis keeps its working dataset in **RAM**. Since memory access is significantly faster than disk access, Redis operations typically complete in **microseconds**, making it ideal for workloads where latency matters.

Because RAM is expensive, Redis is rarely used as the primary database. Instead it usually sits **alongside a database**, acting as a fast layer for frequently accessed or real time data.

Another important detail is that Redis is not just a simple key value store. It is often called a **data structure server** because it supports several built in data types:
* Strings
* Hashes
* Lists
* Sets
* Sorted Sets
* Streams

These structures allow Redis to handle problems like **counters, queues, leaderboards, and messaging** without building complex logic in the application layer.

## Why Redis Is So Fast

Redis performance comes from a few important architectural choices.

The first and most obvious one is **in memory storage**. By avoiding disk I/O during normal operations, Redis removes the biggest latency bottleneck most databases face.

Another interesting design choice is that Redis executes commands on a **single thread**. At first this sounds like a limitation, but it actually simplifies the system significantly. With a single execution thread Redis avoids lock contention, race conditions, and synchronization overhead that often slow down multi threaded systems.

Despite being single threaded, Redis can still handle thousands of concurrent clients using **I/O multiplexing**. The server runs an event loop that listens for activity on many connections simultaneously and processes requests only when they are ready.

This combination of in memory storage, sequential command execution, and event driven networking is the reason Redis can handle **millions of operations per second** in many workloads.

## Why Redis Is Everywhere

![Redis Caching](/redis-caching.png)

Because Redis is extremely fast and provides simple primitives, it naturally fits into many backend architectures.

Some of the most common use cases include:

* **Caching** database queries to reduce load on the primary database
* **Rate limiting** using atomic counters and expiration
* **Real time leaderboards** using sorted sets
* **Queues and event streams** for background processing

In distributed systems, Redis often becomes the **low latency layer** that handles high frequency operations while the primary database focuses on durability and long term storage.

In the next blogs, I plan to dig deeper into Redis internals and architecture, including **persistence mechanisms, replication, clustering, and real world system design patterns built around Redis.**
