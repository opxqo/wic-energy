export interface AccountSummary {
  basicBalance: number | null;
  subsidyBalance: number | null;
  totalBalance: number | null;
  meterReadingKwh: number | null;
  communicationStatus: string | null;
  lightingStatus: string | null;
  airConditioningStatus: string | null;
  meterNumber: string | null;
  readAt: string | null;
}

export interface MonthOption {
  id: number;
  label: string;
  year: number | null;
  month: number | null;
}

export interface UsagePoint {
  label: string;
  value: number;
}

export interface UsageSeries {
  title: string;
  name: string;
  unit: "kWh";
  points: UsagePoint[];
}

export interface PaymentRecord {
  amount: number | null;
  operator: string;
  paidAt: string;
}

export interface SubsidyRecord {
  amount: number | null;
  operator: string;
  grantedAt: string;
}

export type EnergyQuery =
  | { kind: "account" }
  | { kind: "months" }
  | { kind: "monthly"; monthId?: number }
  | { kind: "daily"; monthId?: number }
  | { kind: "hourly"; date?: string }
  | { kind: "payments"; from?: string; to?: string }
  | { kind: "subsidies"; from?: string; to?: string };

export type EnergyResult<Q extends EnergyQuery> = Q extends { kind: "account" }
  ? AccountSummary
  : Q extends { kind: "months" }
    ? MonthOption[]
    : Q extends { kind: "monthly" | "daily" | "hourly" }
      ? UsageSeries
      : Q extends { kind: "payments" }
        ? PaymentRecord[]
        : Q extends { kind: "subsidies" }
          ? SubsidyRecord[]
          : never;

export interface EnergyReader {
  query<Q extends EnergyQuery>(query: Q): Promise<EnergyResult<Q>>;
}

export interface UpstreamPort {
  get(
    route: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<string>;
}
