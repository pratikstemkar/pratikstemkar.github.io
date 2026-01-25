---
title: "What I learned about replication from Designing Data Intensive Applications"
description: "What I learned about replication from Designing Data Intensive Applications"
date: "Jan 25 2026"
tags: ["distributed-systems", "replication", "database", "designing-data-intensive-applications"]
visible: true
---

While reading Chapter 5 on replication from *Designing Data-Intensive Applications* by Martin Kleppmann, I realized that replication is less about copying data and more about making careful trade-offs. It pushes you to think deeply about availability, latency, failure modes, and how much inconsistency your system and its users can realistically tolerate.

Replication sounds simple at first. Keep the same data on multiple machines and everything should work. In reality, the moment data starts changing, the system becomes far more complex.

---

## Why Replication Exists

At its core, replication means keeping copies of the same data on multiple machines connected over a network. Systems replicate data to stay available during failures, to reduce latency by serving users from nearby locations, and to scale by spreading read traffic across replicas.

These benefits are easy to achieve when data never changes. The real challenge appears when writes enter the system. Every update has to be propagated, ordered, and applied correctly across machines that may fail, restart, or temporarily lose network connectivity.

---

## Leader-Based Replication and Its Trade-offs

The most common replication model is leader-based replication. In this approach, one node acts as the leader and accepts all writes. Other nodes act as followers and replicate changes from the leader. Reads can be served from the leader or from followers, but writes always go through the leader.

This model is popular because it is easy to reason about. Having a single place where writes happen avoids conflicts and simplifies application logic. However, it introduces important decisions around how followers acknowledge writes.

With synchronous replication, the leader waits for followers to confirm a write before responding to the client. This improves consistency but reduces availability. If a follower is slow or unavailable, the system may stop accepting writes altogether. Asynchronous replication avoids this by letting the leader respond immediately, but it introduces the risk of losing recent writes if the leader fails before followers catch up.

Most real-world systems choose asynchronous replication and accept temporary inconsistency in exchange for higher availability.

---

## A Visual Guide to Replication Models

At this point, I found it helpful to step back and look at replication models visually. I have included an infographic below that summarizes the major database replication approaches and how they differ in terms of writes, reads, and failure handling.

![Cover Image](/replication-infographics.png)

Seeing these models side by side made it easier to understand why different systems make different trade-offs, and why there is no single “best” replication strategy.

---

## Replication Lag and Unexpected Reads

Once replication becomes asynchronous, replication lag is unavoidable. Followers may fall behind the leader by milliseconds or even seconds, leading to what is often called eventual consistency.

This is where systems start behaving in ways that surprise users. Someone might update their profile and immediately refresh the page, only to see the old data. Another user might see a new comment, refresh, and then watch it disappear because the next read hit a slower replica. In some cases, users can even observe effects before causes, such as seeing a reply before the original post.

These behaviors are not bugs. They are natural consequences of how replication works. Many systems try to reduce user confusion by offering guarantees like reading your own writes or ensuring that a user consistently reads from the same replica.

---

## Multi-Leader Replication and Conflicts

Multi-leader replication allows more than one node to accept writes. This model is commonly used in multi-datacenter setups, offline-first applications, and collaborative systems.

The flexibility comes at a cost. When multiple leaders accept writes, conflicts are unavoidable. Two leaders may update the same record at roughly the same time, and the system must decide how to resolve that conflict.

Some systems rely on simple rules like last write wins, which is easy to implement but can silently lose data. Others use merge strategies or push conflict resolution into application code. More advanced systems rely on data structures like CRDTs to resolve conflicts automatically.

Multi-leader replication improves availability and latency, but it requires much more careful thinking about data semantics.

---

## Leaderless Replication and Embracing Inconsistency

Leaderless replication removes the concept of a leader entirely. Clients write directly to multiple replicas and read from several replicas to determine the most recent value. Consistency is achieved using quorum rules that ensure reads overlap with writes.

Because replicas can temporarily diverge, these systems rely heavily on background processes. Read repair fixes stale replicas during reads, while anti-entropy processes continuously reconcile differences in the background.

Concurrency is a central concern in leaderless systems. Since there is no global ordering of writes, systems track causality using version vectors. When concurrent updates are detected, they must be merged in a way that preserves user intent.

This approach maximizes availability, but it pushes complexity into data modeling and conflict resolution.

---

## Final Thoughts

The biggest takeaway for me from this chapter is that replication is never a purely technical decision. Every replication model encodes assumptions about failure, latency, and correctness.

Single-leader replication is easier to understand and operate. Multi-leader and leaderless systems are more resilient to failures but significantly harder to reason about. There is no universally correct choice.

Replication forces you to decide what matters most for your system and to accept the consequences of that decision. That, more than anything else, is what this chapter taught me.
