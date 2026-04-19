---
title: "Java 21 Virtual Threads"
description: "Scaling backend systems without thread pool headaches"
date: "April 19 2026"
tags: ["java", "concurrency", "virtual-threads", "jvm"]
visible: true
references:
  - label: "Java 21 Docs: Virtual Threads"
    url: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html"
  - label: "Java 21 Virtual Threads - Dude, Where’s My Lock?"
    url: "https://netflixtechblog.com/java-21-virtual-threads-dude-wheres-my-lock-3052540e231d"
---

While building backend systems, concurrency always ends up becoming messy at some point.

You start with simple threads, then move to thread pools, then async code, then suddenly you are dealing with `CompletableFuture`, callbacks, or reactive frameworks. It works, but it rarely feels simple.

Java 21 virtual threads change that in a very fundamental way.

---

## The Core Idea

Traditional threads in Java are platform threads. They are tightly coupled with OS threads, which makes them heavy and limited. You cannot just create thousands of them without thinking about memory and system limits.

Virtual threads are different. They are managed by the JVM instead of the OS. The JVM schedules them on a small pool of actual OS threads called carrier threads.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        System.out.println("Running on: " + Thread.currentThread());
    });
}
```

The important detail is what happens during blocking operations.

When a virtual thread hits something like a database call or network I/O, it pauses and detaches itself from the carrier thread. That carrier thread is immediately free to execute some other virtual thread.

This is what enables massive scale.

---

## This Is Not About Speed

Virtual threads do not make your code execute faster.

They help your system handle more concurrent work.

The focus shifts from reducing latency to improving throughput. You can now run a very large number of concurrent tasks without worrying about thread exhaustion.

The biggest advantage is that you can write simple blocking code and still get scalability that was earlier associated with async models.

---

## Where Virtual Threads Fit Best

They shine in I/O heavy workloads where most of the time is spent waiting.

Typical examples include:

* Web servers handling thousands of requests
* APIs calling multiple downstream services
* Systems doing network or database-heavy operations

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1000; i++) {
        executor.submit(() -> {
            try {
                // Simulating blocking I/O
                Thread.sleep(2000);
                System.out.println("Handled by: " + Thread.currentThread());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }
}
```

Instead of tuning thread pools, you just create a virtual thread per task and let the JVM handle scheduling.

---

## The Mindset Shift

Using virtual threads effectively requires unlearning a few habits.

**Thread pooling is no longer needed.**
Platform threads are expensive, so we pool them. Virtual threads are cheap, so we do not. Each task should get its own virtual thread.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int taskId = i;

        executor.submit(() -> {
            System.out.println("Task " + taskId);
        });
    }
}
```

**Controlling concurrency needs a different approach.**
If you need to limit access to a resource, do not use a fixed thread pool. Use constructs like semaphores. Virtual threads can block safely without wasting OS threads.

```java
Semaphore semaphore = new Semaphore(5);

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 20; i++) {
        int taskId = i;

        executor.submit(() -> {
            try {
                semaphore.acquire();

                System.out.println("Processing " + taskId);
                Thread.sleep(1000);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                semaphore.release();
            }
        });
    }
}
```

**ThreadLocal usage becomes risky.**
With millions of virtual threads, storing data in thread-local variables can quickly blow up memory. It is better to use immutable shared objects or scoped values.

```java
ThreadLocal<StringBuilder> local = ThreadLocal.withInitial(StringBuilder::new);

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            StringBuilder sb = local.get();
            sb.append("data");
        });
    }
}
```

---

## The Hidden Problem: Pinning

There is one important caveat that can cause serious issues.

Normally, a virtual thread releases its carrier thread when it blocks. But in some cases, it cannot. This situation is called pinning.

It typically happens when:

* the code is inside a `synchronized` block or method
* or native methods are involved

```java
synchronized (this) {
    try {
        // Blocking while holding monitor
        Thread.sleep(5000);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}
```

When a pinned virtual thread blocks, it also blocks the underlying OS thread. If enough virtual threads get pinned, you can exhaust all carrier threads.

At that point, your system stops making progress.

---

## A Real Incident from Netflix

This is not just theoretical.

Netflix faced this issue in production when using virtual threads with Tomcat.

Their instances suddenly stopped handling traffic, and they observed a large number of sockets stuck in closeWait.

The root cause was subtle.

Each request was handled by a virtual thread, but a third-party library had a `synchronized` block that interacted with a `ReentrantLock`.

The system had 4 vCPUs, which meant 4 carrier threads.

* Four virtual threads entered the synchronized block and got pinned
* All carrier threads were now occupied
* A fifth virtual thread was ready to acquire the lock
* But there was no carrier thread available to run it

This resulted in a deadlock where nothing could proceed.

---

## Observability Was Tricky

Debugging this was not straightforward.

`jstack` did not show anything useful because it does not include virtual thread stacks. The JVM appeared idle even though the system was stuck.

To properly inspect virtual threads, you need to use:

* `jcmd Thread.dump_to_file`

Even then, important details like locking and waiting states are not clearly visible for virtual threads.

In deeper cases, engineers had to rely on heap dumps and tools like Eclipse MAT just to identify which thread was holding a lock.

---

## Creating Virtual Threads

The API is simple and clean.

You can directly create one using:

* `Thread.ofVirtual().start(...)`

Or use an executor:

* `Executors.newVirtualThreadPerTaskExecutor()`

This executor creates a new virtual thread for every task instead of reusing threads, which aligns with the intended model.

```java
Thread.startVirtualThread(() -> {
    System.out.println("Hello from virtual thread");
});
```

---

## Why Virtual Threads

Virtual threads simplify concurrency in a way that feels very natural.

You can go back to writing straightforward blocking code without worrying about thread limits, and still achieve high scalability.

But they are not a drop-in upgrade if you keep old habits.

If your code heavily relies on thread pools, synchronized blocks, or thread-local caching, you might run into issues like pinning or memory pressure.

The real shift is not just in the API, but in how you think about concurrency.

Once that shift clicks, virtual threads start to feel like the way Java concurrency should have always been.
