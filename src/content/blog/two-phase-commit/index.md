---
title: "Two Phase Commit"
description: "From Theory to a Working Go Implementation"
date: "March 3, 2026"
tags: ["distributed-systems", "database", "two-phase-commit", "distributed-transactions"]
visible: true
references:
  - label: "Database Internals - Alex Petrov"
    url: "https://www.oreilly.com/library/view/database-internals/9781492040330/"
  - label: "Designing Data-Intensive Applications – Martin Kleppmann"
    url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/"
  - label: "Two Phase Commit to power Distributed Transactions in a Distributed System - Arpit Bhayani"
    url: "https://www.youtube.com/watch?v=sZVCpjuVUL8"
---

Over the past few months, I’ve been diving deeper into database internals and distributed systems. The more I read about consistency guarantees and atomicity across services, the more I keep encountering one protocol: Two-Phase Commit.

On paper, 2PC looks simple. In practice, it exposes some of the hardest trade-offs in distributed systems. It forces you to confront questions about durability, crash recovery, and what it really means to promise a commit across machines.

In this post, I’ll explain how 2PC works, why it blocks, and then walk through a working Go implementation with write-ahead logging and crash recovery. The full implementation is available on [GitHub](https://github.com/pratikstemkar/two-phase-commit-implementation).

---

## What Problem Two-Phase Commit Solves

Consider a distributed transaction that spans two services:

* Service A updates a user’s balance.
* Service B updates an order status.

If A commits and B fails, your system is corrupted. Partial success is not acceptable.

Two-Phase Commit guarantees atomicity across nodes:

> All participants either commit together or abort together.

There is no middle state that survives.

---

## The Core Roles

2PC has only two types of actors:

* Coordinator: Orchestrates the transaction.
* Participants (Cohorts): Execute the local work and vote.

The protocol runs in two phases: Prepare and Commit/Abort.

![Two Phase Commit](/two-phase-commit.png)

---

## Phase 1: Prepare

In the prepare phase, the coordinator asks every participant if they are ready to commit.

The coordinator sends a `PREPARE` request to all participants. Each participant must:

1. Acquire required locks.
2. Persist its intent to commit in durable storage.
3. Reply YES or NO.

The important detail is this: once a participant votes YES, it is making an irrevocable promise. Even if it crashes afterward, it must be able to commit once it recovers.

That is why write-ahead logging is mandatory.

### Participant Prepare Handler

Here is the relevant part of the participant implementation:

```go
func (p *Participant) handlePrepare(w http.ResponseWriter, r *http.Request) {
    p.mu.Lock()
    defer p.mu.Unlock()

    var req TxRequest
    json.NewDecoder(r.Body).Decode(&req)

    // Write PREPARED to WAL before responding
    p.appendLog(LogEntry{TxID: req.TxID, State: Prepared})
    p.state[req.TxID] = Prepared

    fmt.Printf("[%s] PREPARED %s\n", p.id, req.TxID)
    w.WriteHeader(http.StatusOK)
}
```

Notice the ordering. The participant logs `PREPARED` before replying OK. This ensures that if the process crashes immediately after voting YES, the intent survives on disk.

The `appendLog` function writes a JSON record to a local WAL file and forces it to disk using `file.Sync()`.

```go
func (p *Participant) appendLog(entry LogEntry) {
    file, _ := os.OpenFile(p.logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    defer file.Close()

    data, _ := json.Marshal(entry)
    file.Write(data)
    file.Write([]byte("\n"))
    file.Sync()
}
```

Without this durability guarantee, the participant could forget it voted YES, breaking atomicity.

---

## Phase 2: Commit or Abort

Once the coordinator collects votes, it decides:

* If all participants voted YES, it commits.
* If any participant voted NO or timed out, it aborts.

The coordinator must log its final decision before notifying participants.

### Coordinator Decision Logic

```go
if allYes {
    decision = Commit
} else {
    decision = Abort
}

// Log decision before broadcasting
c.appendLog(LogEntry{TxID: txID, State: decision})
c.decisions[txID] = decision
```

This ordering is critical. If the coordinator crashes after logging but before broadcasting, it can recover and resend the decision.

After logging, the coordinator enters Phase 2 and sends either `/commit` or `/abort` to each participant.

```go
for _, p := range c.participants {
    if decision == Commit {
        c.client.Post(p+"/commit", "application/json", bytes.NewBuffer(reqBody))
    } else {
        c.client.Post(p+"/abort", "application/json", bytes.NewBuffer(reqBody))
    }
}
```

Participants then append the final state to WAL and release resources.

---

## The Blocking Problem

The real weakness of 2PC appears when failures occur between phases.

Suppose:

1. All participants vote YES.
2. The coordinator crashes before broadcasting COMMIT or ABORT.

Participants are now in `PREPARED` state. They cannot:

* Commit, because they do not know the decision.
* Abort, because they promised to commit if instructed.

They must hold locks and wait.

This is why 2PC is called a blocking protocol. It sacrifices availability to preserve atomic consistency.

### Can We Fix the Blocking Problem?

The honest answer is that pure Two-Phase Commit cannot eliminate blocking. Once a participant votes YES, it cannot safely decide on its own if the coordinator crashes before announcing the final outcome. That uncertainty is fundamental to the protocol.

Three-Phase Commit attempts to address this by introducing an additional intermediate phase and using timeouts so that participants can make deterministic decisions if the coordinator fails. However, 3PC relies on stronger timing assumptions and can behave poorly during network partitions, which is why it is rarely used in practice.

In real systems, blocking is typically mitigated by replicating the coordinator using a consensus protocol like Raft or Paxos so that the commit decision itself is fault tolerant. Blocking in 2PC is not an implementation flaw, it is a direct consequence of the strict atomicity guarantees it provides.

---

## Recovery on Restart

To make this implementation realistic, I added recovery logic to both coordinator and participants.

### Participant Recovery

When a participant starts, it replays its WAL:

```go
func (p *Participant) recoverFromLog() {
    file, err := os.Open(p.logFile)
    if err != nil {
        return
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        var entry LogEntry
        json.Unmarshal(scanner.Bytes(), &entry)
        p.state[entry.TxID] = entry.State
    }

    fmt.Printf("[%s] Recovery complete\n", p.id)
}
```

After recovery, it checks for transactions stuck in `PREPARED`:

```go
func (p *Participant) autoResolvePrepared() {
    for txID, st := range p.state {
        if st == Prepared {
            fmt.Printf("[%s] Resolving PREPARED tx %s\n", p.id, txID)

            resp, err := http.Get(
                fmt.Sprintf("%s/decision?tx_id=%s", p.coordinatorURL, txID),
            )
            if err != nil {
                fmt.Printf("[%s] Coordinator unreachable. Still BLOCKED.\n", p.id)
                continue
            }

            var result map[string]string
            json.NewDecoder(resp.Body).Decode(&result)
            decision := result["decision"]

            if decision == "COMMIT" {
                p.appendLog(LogEntry{TxID: txID, State: Committed})
                p.state[txID] = Committed
            } else if decision == "ABORT" {
                p.appendLog(LogEntry{TxID: txID, State: Aborted})
                p.state[txID] = Aborted
            }
        }
    }
}
```

This simulates how real systems resolve uncertainty after crashes. If the coordinator is alive and has logged a decision, the participant can safely finalize.

If the coordinator is also down, the participant remains blocked. That is the fundamental limitation of 2PC.

### Coordinator Recovery

The coordinator also replays its WAL on startup:

```go
func (c *Coordinator) recoverFromLog() {
    file, err := os.Open(c.logFile)
    if err != nil {
        return
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        var entry LogEntry
        json.Unmarshal(scanner.Bytes(), &entry)
        c.decisions[entry.TxID] = entry.State
    }
}
```

It exposes a `/decision` endpoint so participants can query the final outcome:

```go
func (c *Coordinator) handleDecision(w http.ResponseWriter, r *http.Request) {
    txID := r.URL.Query().Get("tx_id")
    decision := c.decisions[txID]

    resp := map[string]string{
        "decision": string(decision),
    }
    json.NewEncoder(w).Encode(resp)
}
```

This enables auto-resolution after crashes.

---

## Testing Failure Scenarios

This implementation supports crash injection through command-line arguments.

Happy path:

```bash
go run participant/main.go p1 8001 http://localhost:9000 none
go run participant/main.go p2 8002 http://localhost:9000 none
go run coordinator/main.go none
```

Participant crash after prepare:

```bash
go run participant/main.go p1 8001 http://localhost:9000 crash-after-prepare
```

Restart the participant. It will detect PREPARED in WAL and query the coordinator.

Coordinator crash after prepare:

```bash
go run coordinator/main.go crash-after-prepare
```

Participants become blocked. Restart the coordinator and they will auto-resolve.

These scenarios make the blocking nature of 2PC very concrete. You can see the system enter a state of uncertainty and then recover.

---

## Reflections After Implementing It

Reading about 2PC gives you a conceptual understanding of atomic commitment.

Implementing it forces you to think about:

* Log ordering guarantees
* Idempotent message handling
* Crash consistency
* Failure windows between disk and network

The protocol is not complex in structure. What makes it difficult is reasoning about all the interleavings of crash and recovery.

That exercise alone changes how you approach distributed system design.

---

## Final Thoughts

Two-Phase Commit is not obsolete. It is still used in distributed SQL engines, XA transactions, and stream processors.

But it comes with a cost: availability.

If your system cannot tolerate blocking, you need stronger primitives like consensus protocols or architectural changes that avoid distributed transactions entirely.

I recommend implementing it yourself and intentionally breaking it. The failure paths are where the real learning happens.
