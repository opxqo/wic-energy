import {
  parseAccountSummary,
  parseMonthOptions,
  parsePaymentRecords,
  parseSubsidyRecords,
  parseUsageSeries,
} from "./parser.js";
import type {
  EnergyQuery,
  EnergyReader,
  EnergyResult,
  UpstreamPort,
} from "./types.js";
import { validateQuery } from "./validation.js";

export class EnergyService implements EnergyReader {
  constructor(private readonly upstream: UpstreamPort) {}

  async query<Q extends EnergyQuery>(query: Q): Promise<EnergyResult<Q>> {
    query = validateQuery(query) as Q;
    let result: unknown;
    switch (query.kind) {
      case "account":
        result = parseAccountSummary(
          await this.upstream.get("mobile!data.action"),
        );
        break;
      case "months":
        result = parseMonthOptions(
          await this.upstream.get("mobile!yuelist.action"),
        );
        break;
      case "monthly":
        result = parseUsageSeries(
          await this.upstream.get("mobile!rptmonth.action", {
            id: query.monthId,
          }),
        );
        break;
      case "daily":
        result = parseUsageSeries(
          await this.upstream.get("mobile!rptdata.action", {
            id: query.monthId,
          }),
        );
        break;
      case "hourly":
        result = parseUsageSeries(
          await this.upstream.get("mobile!rpt72.action", { id: query.date }),
        );
        break;
      case "payments":
        result = parsePaymentRecords(
          await this.upstream.get("mobile!rptjiaofei.action", {
            shs: query.from,
            gy: query.to,
          }),
        );
        break;
      case "subsidies":
        result = parseSubsidyRecords(
          await this.upstream.get("mobile!rptyuebu.action", {
            shs: query.from,
            gy: query.to,
          }),
        );
        break;
    }
    return result as EnergyResult<Q>;
  }
}
