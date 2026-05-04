import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  error,
  registration,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white",
          "placeholder:text-gray-500 outline-none transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
            : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
        ].join(" ")}
        {...registration}
      />

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs text-red-400"
        >
          <span aria-hidden="true">✕</span>
          {error.message}
        </p>
      )}
    </div>
  );
}
