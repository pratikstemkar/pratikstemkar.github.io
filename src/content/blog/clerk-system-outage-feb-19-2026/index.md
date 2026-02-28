---
title: "What I Learned From the Clerk System Outage"
description: "How a PostgreSQL Query Plan Flip Took Down a Production System"
date: "Feb 22 2026"
tags: ["database", "postgres", "outage", "postmortem"]
visible: true
references:
  - label: "Postmortem: Clerk System Outage (February 19, 2026)"
    url: "https://clerk.com/blog/2026-02-19-system-outage-postmortem"
  - label: "PostgreSQL Documentation: 51.5. Planner/Optimizer"
    url: "https://www.postgresql.org/docs/current/planner-optimizer.html"
  - label: "Basics of Postgres Query Planning"
    url: "https://pganalyze.com/docs/explain/basics-of-postgres-query-planning"
---

I read the postmortem of the Clerk outage that happened on February 19, 2026. What struck me was not that a system went down. That happens. What really caught my attention was the root cause. It was not a DDoS attack, not a bad deploy, not a hardware failure. It was a PostgreSQL query plan flip caused by misleading statistics.

As someone who spends a lot of time thinking about databases and distributed systems, this incident felt like a powerful reminder that the most dangerous failures are often the quiet, internal ones.

---

## What Happened

On February 19, 2026, Clerk experienced a major outage where more than 95 percent of traffic started returning `429 Too Many Requests`. The incident lasted roughly 90 minutes.

At a high level:

* A routine `auto analyze` ran in PostgreSQL
* The database updated its statistics for a frequently queried table
* The query planner chose a new execution plan
* That plan turned out to be extremely inefficient in practice
* Database performance degraded sharply
* Application servers became overloaded and started rate limiting traffic

The system was not technically “down” in the traditional sense. The database was running. The application servers were up. But performance collapsed enough that requests could not be processed in time.

This is what makes query planner issues so tricky. Nothing obvious is broken.

---

## The Root Cause: A Statistics Sampling Problem

PostgreSQL uses a cost-based optimizer. It does not scan the entire table during `ANALYZE`. Instead, it samples rows to estimate:

* How many distinct values a column has
* The fraction of NULL values
* Data distribution histograms
* Selectivity of predicates

In Clerk’s case, there was a column that was almost always `NULL`. Something like 99.9996 percent of rows were null.

When `auto analyze` ran, PostgreSQL sampled a subset of rows. Unfortunately, that sample happened to include only `NULL` values. The planner concluded the column was 100 percent null.

That tiny statistical inaccuracy changed the planner’s assumptions. Based on that belief, it generated a plan that expected zero non-null matches.

In reality, the query returned over 17,000 rows.

The mismatch between estimated rows and actual rows caused the planner to choose an execution path that was dramatically more expensive than intended. That single plan change saturated the database.

This is what people call a query plan flip.

One moment the query runs in milliseconds. The next moment, after updated statistics, it explodes in cost.

---

## Why This Is So Interesting Technically

This incident highlights a few important PostgreSQL concepts that are easy to overlook.

### 1. The Planner Is Only as Good as Its Statistics

Postgres relies heavily on:

* `default_statistics_target`
* Histogram buckets
* Sampled page reads
* Estimated selectivity

If your data distribution is extremely skewed, sampling can mislead the planner. Especially when rare but important values are involved.

### 2. Rare Values Can Be Dangerous

Columns that are almost entirely null are deceptively risky. If the rare non-null values matter to a hot query path, then a sampling miss can cause catastrophic misestimation.

The planner might assume:

* Zero matches
* Extremely high selectivity
* Cheap nested loops

But reality might be:

* Thousands of matches
* Large scans
* Massive I/O amplification

### 3. Plan Stability Is Underrated

We often optimize for average performance. But in production systems, stability is more important than micro-optimizations.

A stable 50 ms query is better than:

* 5 ms most of the time
* 20 seconds after a statistics refresh

This outage reinforces how important plan stability and monitoring are for high-traffic systems.

---

## How They Fixed It

According to the postmortem, the recovery involved:

* Investigating the degraded database performance
* Identifying the plan flip
* Manually re-running `ANALYZE`
* Restoring the previous efficient execution plan

Once the statistics were recalculated properly, the planner reverted to a better strategy and performance returned to normal.

Afterward, they:

* Increased the statistics target for the affected table
* Audited similar queries
* Added monitoring for unexpected plan changes
* Improved incident communication processes

The technical fix was straightforward. The discovery was the hard part.

---

## Broader Lessons I Took Away

Reading this made me reflect on a few things.

### Database internals matter

As application developers, we often treat the database as a black box. But planner behavior, statistics sampling, and cost modeling directly impact availability.

If you run a high-scale system, you cannot ignore:

* `EXPLAIN ANALYZE`
* Row estimate accuracy
* Statistics targets
* Autovacuum behavior

### Observability needs to go deeper

It is not enough to monitor CPU and latency. You need visibility into:

* Query plan changes
* Row estimate vs actual row mismatches
* Sudden shifts in execution strategies

Plan flips should probably be treated like deploys. They can change system behavior dramatically.

### Rare edge cases become production failures

A 0.0004 percent non-null rate sounds harmless. But when that column participates in a critical query path, it can take down a large system.

Skewed data distributions are dangerous. Especially in systems that rely on sampling.

---

## Why This Postmortem Stuck With Me

What I appreciate about this incident is how transparent and detailed the analysis was. It shows that modern outages are often not dramatic failures. They are subtle interactions between:

* Adaptive query planners
* Skewed data
* Sampling heuristics
* Hot query paths

The system did exactly what it was designed to do. The planner updated its statistics and chose what it thought was the cheapest plan.

It just happened to be wrong.

As someone interested in distributed systems and database internals, this was a reminder that reliability is not just about redundancy or scaling. It is also about understanding the invisible decision-making systems inside your stack.

And sometimes, the smallest statistical assumption can cascade into a 90-minute outage.
