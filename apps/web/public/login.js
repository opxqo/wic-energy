document
  .querySelector("#login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#submit");
    if (button.disabled) return;
    const message = document.querySelector("#message");
    const password = document.querySelector("#password");
    button.disabled = true;
    button.textContent = "登录中…";
    message.hidden = true;
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: document.querySelector("#username").value.trim(),
          password: password.value,
        }),
      });
      password.value = "";
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "登录失败");
      }
      // The browser uses the HttpOnly cookie, never stores or displays the response credential.
      window.location.replace("/");
    } catch (error) {
      password.value = "";
      message.textContent = error.message;
      message.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = "登录";
    }
  });
