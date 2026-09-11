import { useRef, useState, type FormEvent } from "react";
import { request } from "./api";
import { PageHeader } from "./components/ui";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Field, FieldGroup, FieldLabel } from "./components/ui/field";
import { Input } from "./components/ui/input";
import { useWebHaptics } from "./hooks/useWebHaptics";

export function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const { trigger } = useWebHaptics();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const password = form.elements.namedItem("password") as HTMLInputElement;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      // Discard the response credential: the browser uses only the HttpOnly cookie.
      await request("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(fields.get("username")).trim(),
          password: fields.get("password"),
        }),
      });
      password.value = "";
      trigger("success");
      window.location.replace("/");
    } catch (error) {
      password.value = "";
      setError(
        error instanceof Error ? error.message : "登录失败，请稍后重试。",
      );
      trigger("error");
      password.focus();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="container login-page">
      <PageHeader title="登录" subtitle="使用学校能源管理账户" />
      <Card className="login-card">
      <CardContent>
      <form className="form" onSubmit={submit} aria-busy={busy}>
        <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">学校账号</FieldLabel>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            maxLength={256}
            autoFocus
            readOnly={busy}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">密码</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            readOnly={busy}
          />
        </Field>
        {error && (
          <Alert variant="destructive" className="message"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "登录中…" : "登录"}
        </Button>
        <p className="note">
          密码仅用于本次学校登录，不保存在服务端。会话过期后需重新登录。
        </p>
        </FieldGroup>
      </form>
      </CardContent>
      </Card>
      <p className="return-index">
        <a href="/">回到首页</a>
      </p>
    </main>
  );
}
