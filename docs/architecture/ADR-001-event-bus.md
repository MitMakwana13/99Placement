# ADR-001: Awaitable Domain Event Bus

**Status:** Accepted  
**Date:** 2026-07-03  
**Authors:** Engineering Team  
**Supersedes:** Fire-and-forget `EventEmitter` implementation in `src/utils/event-bus.ts`

---

## Context

The first implementation of the event system used Node.js's built-in `EventEmitter`:

```ts
// OLD — fire-and-forget
eventBus.emit("CandidateUpdated", payload);
```

Event handlers were registered as async callbacks, but `EventEmitter.emit()` does not await them. This introduced a race condition: callers could assert side-effects (e.g., timeline DB rows) before handlers had finished writing them. This was patched with:

```ts
await new Promise(resolve => setTimeout(resolve, 300)); // ← code smell
```

This is fragile (arbitrary delay), non-deterministic under load, and masks a design flaw.

---

## Decision

Replace the `EventEmitter`-based bus with a custom **`AwaitableDomainEventBus`** that:

1. Accepts typed `DomainEvent` instances (not stringly-typed event names).
2. Awaits **all registered handlers** before returning, using `Promise.allSettled()`.
3. Exposes `publish()`, `publishMany()`, and `subscribe()` as its public API.

### New call site (in `CandidateService`)

```ts
// NEW — fully awaited
await domainEventBus.publish(
  new CandidateUpdatedEvent(tenantId, id, changes, performedById)
);
```

### Handler contract

```ts
interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;  // must return Promise<void>
}
```

---

## File Structure Created

```
src/events/
├── domain-event.ts          ← DomainEvent base class + IEventHandler interface
├── event-bus.ts             ← AwaitableDomainEventBus singleton
├── bootstrap.ts             ← Handler registration at server startup
└── candidate/
    ├── candidate.events.ts  ← Typed event data-carriers
    └── candidate.handlers.ts← One class per handler concern
```

---

## Why `Promise.allSettled()` over `Promise.all()`

| Behaviour | `Promise.all()` | `Promise.allSettled()` |
|-----------|----------------|----------------------|
| If one handler fails | All remaining handlers are cancelled | All handlers still run |
| Error visibility | Only first error | All errors collected |
| Side-effect completeness | Partial | Full |

We chose `allSettled()` because an audit log failure should never prevent a timeline write from completing. All failures are collected and re-thrown as an `AggregateError`.

---

## Alternatives Considered

### Option A: Keep `EventEmitter` + increase setTimeout
Rejected. Arbitrary delays are not deterministic. Under load (slow DB, high concurrency), a 300ms wait may still be insufficient.

### Option B: Wrap EventEmitter with manual promise tracking
Rejected. This is essentially reinventing the wheel with more complexity.

### Option C: Jump directly to BullMQ
Rejected for now. BullMQ adds Redis as an infrastructure dependency and a Worker process. The team is not yet at scale where background queue latency is a problem. The current design explicitly prepares for this migration.

---

## Consequences

### Positive
- Tests are deterministic — no setTimeout hacks anywhere
- Handler failures are always visible to the caller
- Each handler has a single responsibility and is independently testable
- Adding a new handler requires zero changes to the bus or services
- Every event carries a unique eventId for distributed tracing

### Negative / Trade-offs
- Handler execution time now adds to request latency (acceptable at current scale)
- If a handler throws, the service call surface area grows (acceptable; handlers should be robust)

---

## BullMQ Migration Path

When background processing becomes necessary:

1. Replace `DomainEventBus.publish()` body with:
   ```ts
   await queue.add(event.eventName, event);
   ```
2. Move each `handle()` method into a BullMQ `Worker` processor function.
3. All `DomainEvent` classes, `IEventHandler` interfaces, and service-layer `publish()` calls remain **unchanged**.

---

## References
- [Promise.allSettled MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [BullMQ Documentation](https://docs.bullmq.io/)
- NestJS CQRS Module (inspiration for handler-per-class pattern)
