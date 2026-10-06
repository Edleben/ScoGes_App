type SelectFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  options: { label: string; value: string }[];
};

export function SelectField({ label, name, defaultValue, options }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      <span>{label}</span>
      <select
        className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-base text-[var(--foreground)]"
        name={name}
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
