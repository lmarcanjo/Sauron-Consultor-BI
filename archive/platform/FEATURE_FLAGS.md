# Feature Flag Engine Architecture

The Feature Flag Engine dynamically controls modules availability across client workspaces.

## Declared Flags
- `peopleIntelligence`: Employee performance, payload sheets, and commissions evaluation.
- `meetingAi`: Intelligent automated agenda and decision builder.
- `storyBuilder`: Narrative presentation slider engine.
- `executiveDossier`: Dossier compilation tool.
- `copilot`: Generative consulting copilot assistant.

## Integration
Before mounting UI blocks or firing module operations, code blocks should query:
```typescript
import { featureFlagEngine } from "./core/feature-flags/FeatureFlagEngine";

if (featureFlagEngine.isEnabled("peopleIntelligence")) {
  // Mount people intelligence modules
}
```
