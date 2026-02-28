---
title: "Inside PostgreSQL Transactions"
description: "MVCC, Isolation, and What Really Happens Under the Hood"
date: "Feb 28 2026"
tags: ["database", "postgres", "isolation", "postgresql-internals"]
visible: true
references:
  - label: "PostgreSQL Documentation: Chapter 13. Concurrency Control"
    url: "https://www.postgresql.org/docs/18/mvcc.html"
  - label: "Database Transactions - PlanetScale"
    url: "https://planetscale.com/blog/database-transactions"
  - label: "PostgreSQL 14 Internals - Egor Rogov"
    url: "https://postgrespro.com/community/books/internals"
---

When we write:

```sql
BEGIN;
-- some queries
COMMIT;
```

it feels simple. Either everything succeeds, or nothing does.

But under that simplicity, PostgreSQL is running a carefully engineered transaction engine that handles crashes, concurrency, and isolation with impressive precision. In this post, I want to walk through how transactions actually work internally, with a focus on WAL, MVCC, snapshots, and locking.

This is not just about ACID definitions. It is about what really happens inside the database.

---

## The Foundation: Write-Ahead Logging

Durability in PostgreSQL is built on Write-Ahead Logging, commonly called WAL.

Before PostgreSQL modifies any data page on disk, it first writes a record describing the change to the WAL. The WAL is append-only and sequential, which makes it efficient and crash-safe.

If the database crashes due to a power failure or system issue, recovery is straightforward:

* Replay the WAL.
* Redo committed changes.
* Ignore incomplete ones.

This design ensures that once a transaction is committed, its changes survive crashes. The log is the source of truth.

---

## Atomic Commits Are Surprisingly Lightweight

Internally, each transaction is assigned a transaction ID. PostgreSQL tracks the state of each transaction in a commit log structure. A transaction can be:

* In progress
* Committed
* Aborted

When you call `COMMIT`, the critical action is marking the transaction as committed in the commit log after its WAL records are safely written.

That state transition is what makes all its changes visible to other transactions.

If a backend crashes before marking the transaction as committed, other transactions will treat it as aborted. No complicated undo of table data is required. The visibility rules handle it automatically.

---

## MVCC: Why Readers and Writers Do Not Block Each Other

The real power of PostgreSQL’s concurrency model comes from Multi-Version Concurrency Control, or MVCC.

Instead of overwriting rows in place, PostgreSQL creates new versions of rows.

Every row version, also called a tuple, contains two important fields:

* `xmin`: the transaction ID that created it
* `xmax`: the transaction ID that deleted or replaced it

When you update a row:

* A new version is inserted with a new `xmin`
* The old version’s `xmax` is set to your transaction ID

Nothing is overwritten in place.

### How Visibility Works

When a transaction starts, PostgreSQL takes a snapshot. This snapshot includes:

* The current transaction ID counter
* A list of transactions that are active at that moment

When reading a row, PostgreSQL checks:

* Did the creating transaction commit before my snapshot?
* Was the deleting transaction committed before my snapshot?

If the answers align with the snapshot rules, the row is visible.

This approach allows:

* Readers to proceed without blocking writers
* Writers to proceed without blocking readers

A `SELECT` does not need to acquire heavy locks for visibility. It just evaluates metadata against its snapshot.

That is why PostgreSQL scales so well under mixed read and write workloads.

---

## The Cost of MVCC: Cleaning Up Dead Tuples

Because PostgreSQL keeps old row versions, the table gradually accumulates dead tuples. These are versions that are no longer visible to any active transaction.

Cleanup is handled by `VACUUM`:

* Reclaims space from dead tuples
* Updates statistics for the query planner

`VACUUM FULL` goes further and rewrites the entire table to compact it physically, but it is heavier and requires stronger locking.

Without regular vacuuming, tables would keep growing and performance would suffer. MVCC gives you concurrency, but it requires active garbage collection.

---

## Isolation Levels in Practice

PostgreSQL supports the standard isolation levels:

* Read Uncommitted
* Read Committed
* Repeatable Read
* Serializable

In reality, Read Uncommitted behaves like Read Committed.

### Read Committed

This is the default level.

Each statement sees only data committed before that statement begins. If you run two `SELECT` statements inside the same transaction, they might see different results if another transaction commits in between.

For most applications, this is sufficient.

### Repeatable Read

In this mode, the snapshot is taken at the beginning of the transaction and remains fixed. All reads see the same consistent view, even if other transactions commit later.

This prevents non-repeatable reads and provides stronger guarantees.

### Serializable

Serializable mode provides the strongest guarantees. It ensures that the outcome is equivalent to transactions running one after another.

PostgreSQL implements this using predicate locking and conflict detection.

Instead of blocking aggressively, PostgreSQL tracks read and write dependencies between transactions. If it detects a pattern that cannot be serialized safely, it aborts one of the transactions.

For example:

```sql
SELECT * FROM accounts WHERE balance > 1000;
```

The system tracks the predicate used in the query. If a concurrent transaction modifies rows in a way that would violate serializable guarantees, one transaction is rolled back.

Applications using Serializable isolation must be prepared to retry transactions when they fail due to serialization errors.

---

## Locking Still Matters

Even with MVCC, locks are necessary.

Operations like `ALTER TABLE` or `DROP TABLE` require table-level locks to prevent structural changes while other transactions are accessing the table.

PostgreSQL maintains a shared-memory lock table. If a transaction requests a lock that conflicts with another, it waits. If waiting leads to a cycle of dependencies, a deadlock detection algorithm identifies the cycle and aborts one transaction.

In addition to heavyweight locks, PostgreSQL uses lightweight locks and spin locks internally to protect shared-memory data structures. These are short-lived and optimized for performance.

---

## Final Thoughts

PostgreSQL’s transaction engine is a combination of:

* Write-Ahead Logging for durability
* MVCC for concurrency
* Snapshots for isolation
* Locking for structural safety
* Background cleanup through VACUUM

All of this works together to provide strong guarantees without sacrificing performance.

Understanding these internals changes how you think about queries, isolation levels, and performance tuning. It also makes it clear why certain patterns, such as long-running transactions or neglected vacuuming, can cause subtle and serious problems.

The next time you write `BEGIN` and `COMMIT`, you will know that a lot more is happening than it appears on the surface.
