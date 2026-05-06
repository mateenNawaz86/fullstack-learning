import { useState } from "react";
import { EyeCloseIcon } from "@/src/assets/components/eye-close-icon";
import { EyeOpenIcon } from "@/src/assets/components/eye-open-icon";
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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  const inputClass = [
    "w-full rounded-lg border bg-white/5 py-2.5 text-sm text-white",
    "placeholder:text-gray-500 outline-none transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    isPassword ? "pl-4 pr-10" : "px-4",
    error
      ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
      : "border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
  ].join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass}
          {...registration}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {showPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
          </button>
        )}
      </div>

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
