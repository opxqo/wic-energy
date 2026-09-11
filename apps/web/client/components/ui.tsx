import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import {
  Empty as ShadcnEmpty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "./ui/empty";
import { TrailingDots } from "./TrailingDots";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -3 }}
    >
      {children}
    </motion.div>
  );
}
export function PageHeader({
  title = "WIC Energy",
  subtitle = "宿电 · 学校用电查询",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <header className="page-header">
      <h1 className="title">{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  );
}
export { PulsatingDots } from "./PulsatingDots";

export function StatusEmpty({
  children,
  loading = false,
  loader,
}: {
  children: ReactNode;
  loading?: boolean;
  loader?: ReactNode;
}) {
  return (
    <ShadcnEmpty className="empty">
      <EmptyHeader>
        <EmptyMedia variant="icon" aria-hidden="true">
          {loading ? (loader ?? <TrailingDots />) : "—"}
        </EmptyMedia>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </ShadcnEmpty>
  );
}
export function formatNumber(value: number | null, digits = 2) {
  return value === null
    ? "—"
    : value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
}
