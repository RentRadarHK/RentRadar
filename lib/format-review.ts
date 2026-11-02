export function formatUnitTypeLabel(unitType?: string | null): string | undefined {
  if (!unitType) return undefined;
  switch (unitType) {
    case "studio":
      return "Studio";
    case "1bed":
      return "1 bed";
    case "2bed":
      return "2 bed";
    case "3bed":
      return "3 bed";
    case "4bed+":
      return "4 bed+";
    default:
      return unitType;
  }
}

export function formatFloorLabel(floorNumber?: string | null): string | undefined {
  if (!floorNumber) return undefined;
  const trimmed = floorNumber.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return `${trimmed}/F`;
  return trimmed;
}

export function formatHkd(amount: number): string {
  return `HKD ${Math.round(amount).toLocaleString("en-HK")}`;
}

export function formatRentPaid(
  monthlyRent?: number | null,
  flatSizeSqft?: number | null
): string | undefined {
  if (monthlyRent == null || monthlyRent <= 0) return undefined;
  const rent = `${formatHkd(monthlyRent)}/month`;
  if (flatSizeSqft != null && flatSizeSqft > 0) {
    const perSqFt = Math.round(monthlyRent / flatSizeSqft);
    return `${rent} (${formatHkd(perSqFt)}/sq ft)`;
  }
  return rent;
}

export function formatTenancyDetailsLine(review: {
  unitType?: string | null;
  floorNumber?: string | null;
  unitNumber?: string | null;
  monthlyRent?: number | null;
  flatSizeSqft?: number | null;
}): string | null {
  const unitNumber = review.unitNumber?.trim();
  const parts = [
    formatUnitTypeLabel(review.unitType),
    formatFloorLabel(review.floorNumber),
    unitNumber ? (unitNumber.toLowerCase().startsWith("unit") ? unitNumber : `Unit ${unitNumber}`) : undefined,
    formatRentPaid(review.monthlyRent, review.flatSizeSqft),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
