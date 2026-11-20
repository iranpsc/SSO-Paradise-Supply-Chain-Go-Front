import { useState, type InputHTMLAttributes } from "react";
export function Field({
  label,
  error,
  name,
  type,
  "aria-describedby": describedBy,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-bold">
        {label}
      </label>
      <div className={isPassword ? "field-password-wrap" : undefined}>
        <input
          id={name}
          name={name}
          type={isPassword && passwordVisible ? "text" : type}
          className={`field${isPassword ? " field-password" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [describedBy, error ? `${name}-error` : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field-password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            aria-pressed={passwordVisible}
            disabled={props.disabled}
          >
            {passwordVisible ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.2A11 11 0 0121 12a11.8 11.8 0 01-3.1 4.2M6.2 6.2A12 12 0 003 12s3 7 9 7a9.7 9.7 0 004.1-.9" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          className="field-error text-xs text-red-600 dark:text-red-400"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
