import { DETECTORS } from "./piiPatterns";

/**
 * detectColumns
 *   Given { headers, rows } (rows are arrays aligned to headers), scan each
 *   column with every detector. Return a per-column verdict.
 *
 *   opts.customDetectors — extra detectors to append (from user rules).
 *   Each column also captures up to 3 example matched values per detector
 *   to power the drill-down UI ("show me the evidence").
 */
export function detectColumns({ headers, rows }, opts = {}) {
  const sampleLimit = opts.sampleLimit ?? 500;
  const sample = rows.slice(0, sampleLimit);
  const allDetectors = [...DETECTORS, ...((opts.customDetectors) || [])];

  return headers.map((header, idx) => {
    const values = [];
    for (const row of sample) {
      const v = row[idx];
      if (v !== undefined && v !== null && String(v).trim() !== "") values.push(String(v).trim());
    }
    const nonEmpty = values.length;

    const findings = [];
    for (const det of allDetectors) {
      let hits = 0;
      let scoreSum = 0;
      const examples = [];
      for (const v of values) {
        const s = det.test(v);
        if (s > 0) {
          hits++; scoreSum += s;
          if (examples.length < 3) examples.push(v);
        }
      }
      if (nonEmpty === 0) continue;
      const matchRate = hits / nonEmpty;
      const headerHit = det.columnHint && det.columnHint.test(header);
      const boost = headerHit ? (det.columnHintBoost ?? 0.15) : 0;
      if (matchRate < 0.35 && !headerHit) continue;
      const avgValueScore = hits ? scoreSum / hits : 0;
      const columnConfidence = Math.min(
        0.99,
        (avgValueScore || det.base) * (0.35 + 0.65 * matchRate) + boost
      );
      findings.push({
        detectorId: det.id,
        name: det.name,
        category: det.category,
        tier: det.tier,
        citation: det.citation,
        hits,
        sampled: nonEmpty,
        matchRate,
        confidence: Number(columnConfidence.toFixed(3)),
        headerHit: !!headerHit,
        examples,
        isCustom: !!det._custom,
      });
    }

    findings.sort((a, b) => b.confidence - a.confidence);
    const top = findings[0] || null;

    return {
      index: idx,
      header,
      sampled: nonEmpty,
      containsPII: !!top,
      top,
      findings,
      // Default transformation suggestion
      suggested: top ? defaultTransformFor(top) : "keep",
    };
  });
}

function defaultTransformFor(finding) {
  switch (finding.detectorId) {
    case "email":
    case "phone":
    case "person_name":
    case "url":
    case "mac":
      return "synthetic";
    case "credit_card":
    case "iban":
    case "ssn":
    case "passport":
    case "us_dl":
    case "nhs":
    case "aadhaar":
      return "hash";
    case "dob":
    case "postal_us":
    case "postal_uk":
    case "ipv4":
    case "ipv6":
      return "generalize";
    case "address_street":
      return "redact";
    case "company":
    case "job_title":
      return "generalize";
    default:
      return finding.confidence > 0.7 ? "redact" : "keep";
  }
}
