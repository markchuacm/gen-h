import { JOURNEY_STATES, JOURNEY_STATE_IDS } from "../journey/journeyState";
import type { JourneyStateId } from "../journey/journeyState";

type DevStateSwitcherProps = {
  value: JourneyStateId;
  onChange: (state: JourneyStateId) => void;
};

// Demo-only control for walking through the five journey states.
function DevStateSwitcher({ value, onChange }: DevStateSwitcherProps) {
  return (
    <select
      className="p-demo-select"
      value={value}
      onChange={(event) => onChange(event.target.value as JourneyStateId)}
      aria-label="Preview journey state"
    >
      {JOURNEY_STATE_IDS.map((id) => (
        <option key={id} value={id}>
          {JOURNEY_STATES[id].switcherLabel}
        </option>
      ))}
    </select>
  );
}

export default DevStateSwitcher;
