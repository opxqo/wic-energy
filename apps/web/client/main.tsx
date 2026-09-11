import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { MotionConfig } from "motion/react";
import { TrailingDots } from "./components/TrailingDots";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-600.css";
import "./styles.css";

const App = lazy(() => import("./App").then((m) => ({ default: m.App })));
const Login = lazy(() => import("./Login").then((m) => ({ default: m.Login })));
const Docs = lazy(() => import("./Docs").then((m) => ({ default: m.Docs })));

const Page =
  location.pathname === "/login.html"
    ? Login
    : location.pathname === "/docs.html"
      ? Docs
      : App;
createRoot(document.getElementById("root")!).render(
  <MotionConfig
    reducedMotion="user"
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
  >
    <Suspense fallback={<div role="status" aria-label="正在加载页面" className="container"><TrailingDots /></div>}>
      <Page />
    </Suspense>
  </MotionConfig>,
);
