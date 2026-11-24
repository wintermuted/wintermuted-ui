import type { ReactElement } from "react";

import type { NumberStepperProps } from "../interfaces.js";
import { Button } from "./Button.js";
import { Tooltip } from "./Tooltip.js";

function decimalPlaces(value: number): number {
  const [coefficient, exponent = "0"] = String(value).split("e");
  return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent));
}

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
  function change(direction: number): void {
    const next = value + direction * step;
    const precision = Math.max(decimalPlaces(value), decimalPlaces(step));
    // toFixed supports up to 100 fractional digits; finer steps retain native precision.
    const rounded = Number.isFinite(next) && precision <= 100 ? Number(next.toFixed(precision)) : next;
    onChange(Math.min(max, Math.max(min, rounded)));
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
          onClick={() => change(-1)}
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
          onClick={() => change(1)}
        >
          {increaseIcon}
        </Button>
      </Tooltip>
    </div>
  );
}
