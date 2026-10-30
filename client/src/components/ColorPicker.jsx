import { COLORS } from "../constants";

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Note color">
      {COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.name}
          title={c.name}
          className={`swatch ${value === c.value ? "selected" : ""}`}
          style={{ background: c.value }}
          onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  );
}
