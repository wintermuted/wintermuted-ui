import type { ReactElement } from "react";

import type { NumberStepperProps } from "../interfaces.js";
import { Button } from "./Button.js";
import { Tooltip } from "./Tooltip.js";

export function NumberStepper({
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  label,
  decreaseLabel,
  increaseLabel,
  valueLabel,
  decreaseIcon,
  increaseIcon,
  tooltipPlacement = "above",
}: NumberStepperProps): ReactElement {
  if (
    ![value, min, max, step].every(Number.isFinite) ||
    min > max ||
    step <= 0 ||
    value < min ||
    value > max
  ) {
    throw new RangeError(
      "NumberStepper requires a finite value within bounds and a positive finite step.",
    );
  }
  return (
    <div
      className="wm-stepper"
      role="group"
      aria-label={label}
    >
      <Tooltip text={decreaseLabel} placement={tooltipPlacement}>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          aria-label={decreaseLabel}
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, Number((value - step).toPrecision(15))))}
        >
          {decreaseIcon}
        </Button>
      </Tooltip>
      <Tooltip text={valueLabel} placement={tooltipPlacement}>
        <span className="wm-stepper-value" tabIndex={0} aria-label={valueLabel} aria-live="polite">
          {value}
        </span>
      </Tooltip>
      <Tooltip text={increaseLabel} placement={tooltipPlacement}>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          aria-label={increaseLabel}
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, Number((value + step).toPrecision(15))))}
        >
          {increaseIcon}
        </Button>
      </Tooltip>
    </div>
  );
}
