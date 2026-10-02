import { AlertCircle } from "lucide-react";
import { cloneElement } from "react";

interface FieldProps {
  label: string;
  /** The id of the input inside. */
  id: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactElement<Record<string, unknown>>;
}

/**
 * A form field: label on top, then the input, then a hint or an error message.
 * The input gets its id and aria attributes added, so screen readers read the hint and error too.
 */
export function Field({ label, id, hint, error, optional, children }: FieldProps) {
  const messageId = `${id}-message`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-semibold text-text">
        {label}
        {optional && <span className="font-normal text-subtle"> (optional)</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="flex items-start gap-1.5 text-small text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-small text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
