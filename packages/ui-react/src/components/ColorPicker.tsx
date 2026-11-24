import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { normalizeHex } from "./colorValue.js";

import type { ColorPickerProps } from "../interfaces.js";

export function ColorPicker({
  value,
  groups,
  onSelect,
  onChange,
  onCommit,
  label,
  inputLabel,
  hexLabel,
  invalidLabel,
  disabled = false,
  placement = "above",
  className = "",
  triggerClassName = "",
  inputId,
  draftValue,
  onDraftChange,
}: ColorPickerProps): ReactElement {
  const [internalDraft, setInternalDraft] = useState(value);
  const controlledDraft = draftValue !== undefined;
  const draft = draftValue ?? internalDraft;
  const setDraft = onDraftChange ?? setInternalDraft;
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const skipBlurCommit = useRef(false);
  useEffect(() => {
    if (!controlledDraft) setInternalDraft(value);
    setInvalid(false);
  }, [value, controlledDraft]);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: MouseEvent): void {
      if (event.target instanceof Node && !details.current?.contains(event.target)) {
        if (details.current) details.current.open = false;
      }
    }
    document.addEventListener("mousedown", dismiss);
    return () => document.removeEventListener("mousedown", dismiss);
  }, [open]);
  if (controlledDraft !== (onDraftChange !== undefined)) {
    throw new Error("ColorPicker draftValue and onDraftChange must be supplied together.");
  }
  function close(): void {
    if (details.current) details.current.open = false;
    trigger.current?.focus();
  }
  function commit(): string | null {
    const normalized = normalizeHex(draft);
    setInvalid(normalized === null);
    if (normalized) {
      setDraft(normalized);
      onChange(normalized);
    }
    return normalized;
  }
  return (
    <details
      ref={details}
      className={`wm-color-picker wm-color-picker-${placement} ${className}`}
      aria-label={label}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <summary
        ref={trigger}
        className={`wm-color-picker-trigger ${triggerClassName}`}
        aria-label={label}
      >
        <span
          className="wm-color-picker-dot"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </summary>
      <div className="wm-color-picker-panel">
        <p className="wm-color-picker-title">{label}</p>
        {groups.map((group) => (
          <div key={group.id}>
            <p className="wm-color-group-label">{group.label}</p>
            <div className="wm-color-swatch-grid" role="group" aria-label={group.label}>
              {group.choices.map((choice, index) => (
                <button
                  key={`${choice.value}-${index}`}
                  type="button"
                  className={`wm-color-swatch${value.toLowerCase() === choice.value.toLowerCase() ? " wm-color-swatch-active" : ""}`}
                  style={{ backgroundColor: choice.value }}
                  aria-label={choice.label}
                  aria-pressed={value.toLowerCase() === choice.value.toLowerCase()}
                  title={choice.value}
                  disabled={disabled}
                  onClick={() => {
                    setDraft(choice.value);
                    setInvalid(false);
                    onSelect(choice.value, group.id, index);
                    close();
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="wm-custom-color-row">
          <label className="wm-custom-color-label" htmlFor={id}>
            {inputLabel}
          </label>
          <div className="wm-custom-color-inputs">
            <input
              id={id}
              className="wm-color-native-input"
              type="color"
              value={value}
              disabled={disabled}
              aria-label={inputLabel}
              onChange={(event) => {
                setDraft(event.target.value);
                setInvalid(false);
                onChange(event.target.value);
              }}
            />
            <input
              className="wm-color-hex-input"
              type="text"
              value={draft}
              disabled={disabled}
              aria-label={hexLabel}
              aria-invalid={invalid}
              aria-describedby={invalid ? `${id}-error` : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setInvalid(false);
              }}
              onBlur={() => {
                if (!skipBlurCommit.current) commit();
                skipBlurCommit.current = false;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const color = commit();
                  if (color) {
                    onCommit?.(color);
                    skipBlurCommit.current = true;
                    close();
                    skipBlurCommit.current = false;
                  }
                }
              }}
            />
          </div>
          {invalid && (
            <span id={`${id}-error`} className="wm-color-error" role="alert">
              {invalidLabel}
            </span>
          )}
        </div>
      </div>
    </details>
  );
}
