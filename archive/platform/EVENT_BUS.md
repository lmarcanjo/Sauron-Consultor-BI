# Event Bus Architecture

Sauron's Event Bus enables reactive, non-blocking communication across decoupled business models.

## Domain Events

The platform declares the following high-fidelity events:
- `WorkspaceChanged`: Triggered when selecting or loading a different client case.
- `CaseChanged`: Triggered when modifying project data.
- `MeetingStarted`: Fired when starting a board meeting ritual.
- `PresentationApproved`: Fired when a presentation deck is approved by the council.
- `ActionCompleted`: Fired when completing an items checklist.
- `DataImported`: Dispatched after ingestion of spreadsheets.
- `DatabaseSynced`: Fired on successful database sync.

## Example Subscription
```typescript
import { eventBus } from "./core/events/EventBus";

const unsubscribe = eventBus.subscribe("DatabaseSynced", (payload) => {
  console.log(`Synced ${payload.count} records from ${payload.sourceName}`);
});

// To clean up:
unsubscribe();
```
