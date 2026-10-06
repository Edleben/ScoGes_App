import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
  autoComplete,
}: FormFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      <span>{label}</span>
      <input
        className={cn(
          "min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-base text-[var(--foreground)]",
          "placeholder:text-slate-400",
        )}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
      />
    </label>
  );
}
