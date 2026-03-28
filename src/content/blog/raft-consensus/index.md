---
title: "Raft Consensus Algorithm"
description: "A simple way to make multiple servers agree and stay consistent"
date: "March 28, 2026"
tags: ["database", "raft", "consensus", "distributed-systems"]
visible: true
references:
  - label: "Designing for Understandability: The Raft Consensus Algorithm"
    url: "https://www.youtube.com/watch?v=vYp4LYbnnW8"
  - label: "The Raft Consensus Algorithm"
    url: "https://raft.github.io/"
  - label: "In Search of an Understandable Consensus Algorithm"
    url: "https://raft.github.io/raft.pdf"
---

Distributed systems fail in ways that single-machine systems never do. Nodes crash, networks partition, messages arrive late or never. If you still want your system to behave correctly, you need one core guarantee: agreement across machines.

That is the consensus problem.

For a long time, Paxos was the standard answer. It is powerful, but also notoriously hard to reason about and even harder to implement correctly. Most teams end up building variants that drift away from the original guarantees.

Raft takes a different approach. It is designed to be practical first. Same guarantees, but structured in a way that engineers can actually build and debug.

---

## Why Consensus Exists

At its core, consensus is about getting multiple servers to agree on a sequence of values, not just once, but continuously as the system processes requests. This is typically implemented using a replicated state machine. Each node maintains a log of commands, and the system guarantees that all logs are identical in both content and order. Since the state machine is deterministic, applying the same sequence produces the same result across all nodes.

The system remains available as long as a majority of nodes are alive. In a five-node cluster, three nodes are enough to continue making progress. This quorum-based design is what gives distributed systems their fault tolerance.

![Replicated State Machine](/state-machine.png)

---

## What Raft Optimizes For

Raft is not introducing a new form of consensus. It is reshaping the problem so that it is easier to understand and implement correctly.

Instead of treating consensus as one large problem, Raft breaks it into three parts: leader election, log replication, and safety. This separation makes it easier to reason about each piece independently.

It also enforces a strong leader model. All client requests go through the leader, and log entries flow in one direction only, from leader to followers. This removes a lot of edge cases that make other algorithms hard to follow.

---

## System Model

A Raft node is always in one of three states: leader, follower, or candidate. Time is divided into terms, which act like a logical clock. Each term begins with an election, and if a leader is chosen, it remains in charge for the rest of that term.

Communication between nodes is intentionally minimal. The protocol relies on just two RPCs: RequestVote and AppendEntries. Despite this simplicity, these two primitives are enough to handle both elections and replication.

![State](/state.png)

---

## Leader Election

Leader election in Raft is driven by timeouts. Followers expect regular heartbeats from the leader. These are simply empty AppendEntries calls. If a follower stops receiving them, it assumes the leader has failed.

At that point, it increments its term, becomes a candidate, votes for itself, and asks other nodes for votes. To become leader, it needs votes from a majority of the cluster.

The tricky part is handling split votes. If multiple nodes start elections at the same time, no one may get a majority. Raft avoids this using randomized election timeouts. Each node waits for a slightly different duration before starting an election, which makes it very likely that one node starts first and wins cleanly. This small design choice removes a lot of coordination complexity.

![Leader Election](/leader-election.png)

---

## Log Replication

Once a leader is elected, all client interaction flows through it. When a request comes in, the leader appends it to its own log and then tries to replicate it to followers using AppendEntries.

An entry is only considered committed once it has been replicated on a majority of nodes. Only after that does the leader apply it to its state machine and return a response to the client. Followers apply the entry after they learn it is committed.

Consistency is enforced through the log matching property. If two logs share an entry at the same index and term, then everything before that entry must also be identical. To maintain this, each AppendEntries request includes information about the previous log entry. If a follower detects a mismatch, it rejects the request.

The leader then backs up and retries until it finds the point where both logs agree. From there, it overwrites any conflicting entries on the follower. The leader’s log is always treated as the source of truth, and followers are forced to converge to it.

---

## Safety Guarantees

The most critical requirement in any consensus algorithm is that once a value is committed, it is never lost or overwritten.

Raft ensures this through the Leader Completeness Property. A node cannot become leader unless it already contains all committed entries. During elections, candidates include information about their last log entry. Followers only grant their vote if the candidate’s log is at least as up to date as their own.

Because committed entries must exist on a majority of nodes, and elections require a majority to win, any elected leader is guaranteed to have those entries. This avoids the need for complicated recovery mechanisms after elections.

---

## Cluster Changes

Changing cluster membership without breaking consensus is harder than it looks. If done incorrectly, the system can temporarily split into multiple groups, each believing it has a majority.

Raft handles this using joint consensus. Instead of switching configurations instantly, the system transitions through a phase where both the old and new configurations must agree. This ensures continuity and prevents split-brain scenarios while changes are in progress.

---

## Log Compaction

Over time, the log grows indefinitely, which is not practical. Raft addresses this using snapshotting. The state machine periodically persists its entire state, allowing the system to discard older log entries.

This reduces storage usage and significantly improves recovery time, since new or recovering nodes can load a snapshot instead of replaying the entire history.

---

## Why Raft Works in Practice

Raft works because it embraces constraints instead of avoiding them. By enforcing a single leader, using terms to detect stale state, and relying on majority agreement, it creates a system that is both predictable and fault tolerant.

What stands out is that you can actually implement it without constantly second guessing edge cases. The design guides you toward correctness.

---

## Conclusion

Consensus is one of those topics that feels theoretical until you have to build something that cannot afford to be wrong.

Raft does not simplify the problem itself, but it simplifies how we think about it. And that is what makes it practical.
