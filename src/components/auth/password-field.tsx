import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
};

export function PasswordField({ id, label, value, onChange, autoComplete, error, hint }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="auth-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="auth-password-input">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required
        />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && <p id={hintId} className="auth-field-hint">{hint}</p>}
      {error && <p id={errorId} className="auth-field-error" role="alert">{error}</p>}
    </div>
  );
}
