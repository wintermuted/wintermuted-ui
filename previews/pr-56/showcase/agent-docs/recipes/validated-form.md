# Build a validated form

Install `@wintermuted/ui-react`, `@wintermuted/ui-theme`, React and React DOM. Check your installed exports and declarations before using these source-revision examples.

Save this as `ContactForm.tsx`. Supply `onSave` from your application's API/storage layer; it receives only valid, trimmed values. The form retains its draft on failure, announces errors, and disables repeat submissions while saving. `FieldGroup` associates both hints and errors with the native input; validation rules and submit state are application-owned.

```tsx
import "@wintermuted/ui-theme/index.css";
import { useRef, useState, type FormEvent } from "react";
import { Alert, Button, FieldGroup, Input } from "@wintermuted/ui-react";

export function ContactForm({ onSave }: {
  onSave: (contact: { name: string; email: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameError = name.trim() ? undefined : "Enter a name.";
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined : "Enter a valid email address.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setNotice(null);
    if (nameError || emailError) {
      (nameError ? nameRef : emailRef).current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim() });
      setNotice({ error: false, text: "Contact saved." });
    } catch (error) {
      setNotice({ error: true, text: error instanceof Error ? error.message : "Could not save the contact." });
    } finally {
      setSaving(false);
    }
  }

  return <form noValidate onSubmit={submit} aria-busy={saving}>
    <fieldset disabled={saving}>
      <legend>Contact details</legend>
      <FieldGroup label="Name" hint="Use the name shown on correspondence."
        error={submitted ? nameError : undefined}>
        <Input ref={nameRef} name="name" autoComplete="name" required
          value={name} onChange={event => { setName(event.target.value); setNotice(null); }} />
      </FieldGroup>
      <FieldGroup label="Email" hint="We will use this address to contact you."
        error={submitted ? emailError : undefined}>
        <Input ref={emailRef} name="email" type="email" autoComplete="email" required
          value={email} onChange={event => { setEmail(event.target.value); setNotice(null); }} />
      </FieldGroup>
      <Button type="submit">{saving ? "Saving contact..." : "Save contact"}</Button>
    </fieldset>
    {submitted && (nameError || emailError)
      ? <Alert tone="danger" role="alert">Correct the indicated fields before saving.</Alert> : null}
    {notice ? <Alert tone={notice.error ? "danger" : "success"}
      role={notice.error ? "alert" : "status"}>{notice.text}</Alert> : null}
  </form>;
}
```

The email rule is a deliberately small application policy, not proof that an address exists. Repeat validation on the server. Keep callback error messages safe for display; do not expose internal exception details from your API.

## References

- [Installation and package selection](../installation.md)
- [All task-oriented recipes](../recipes.md)
- [React component contracts](../react.md)
- [CSS imports and dependencies](../theme.md)
- [Theme preferences and SSR](../theming.md)
