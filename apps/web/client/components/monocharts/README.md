# Monocharts source components

Source: https://github.com/Subhan-code/Monocharts

Pinned revision: `114613e815076bb79ef6fe119d90493172df1756` (MIT, see LICENSE).

Adapted from `src/components/mono-charts/MonoRoundedBarChart.tsx` and
`src/components/mono-charts/MonoRoundedLineChart.tsx`. The local haptics hook is
adapted from `src/hooks/useWebHaptics.ts` in the same revision.

This library distributes editable React source. WIC vendors the two chart
primitives rather than bundling the upstream component catalog. Their rounded
bars, line caps, spline curves, understated grid, responsive stage and neutral
palette are preserved. Catalog headings, fixed demo metrics, duplicate series,
dark theme and layout switches were replaced by typed school data props and
shared WIC controls. Tailwind declarations are represented in `client/styles.css`
to retain the existing application's styling approach. Recharts tooltips expose
real kWh values; animations are brief and respect reduced motion. Full values
remain available in an accessible HTML table, including all zero values.

No registry CLI or copy-code catalog is exposed in the product. This repository
consumes Monocharts; it does not publish new Amicro registry entries.
