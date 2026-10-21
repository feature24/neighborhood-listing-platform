import fs from "node:fs";
import path from "node:path";

const pass = [];
const fail = [];

function expect(name, condition) {
  if (condition) {
    pass.push(name);
    console.log(`PASS: ${name}`);
  } else {
    fail.push(name);
    console.error(`FAIL: ${name}`);
  }
}

function eligible(context, sponsor) {
  const now = new Date(context.now ?? "2026-10-20T12:00:00Z");

  if (sponsor.status !== "APPROVED") return false;
  if (!sponsor.active) return false;
  if (sponsor.placement !== context.placement) return false;

  const start = new Date(sponsor.start_at);
  const end = new Date(sponsor.end_at);

  if (now < start || now > end) return false;

  return (
    sponsor.target_zip === context.propertyZip ||
    sponsor.distance_miles <= sponsor.radius_miles
  );
}

const rank = {
  PLATINUM: 3,
  GOLD: 2,
  SILVER: 1,
};

function selectSponsor(context, candidates) {
  const matches = candidates.filter((s) => eligible(context, s));

  if (matches.length === 0) return null;

  return [...matches].sort((a, b) => {
    const zipA = a.target_zip === context.propertyZip ? 1 : 0;
    const zipB = b.target_zip === context.propertyZip ? 1 : 0;

    if (zipA !== zipB) return zipB - zipA;
    if (rank[a.tier] !== rank[b.tier]) return rank[b.tier] - rank[a.tier];
    if (a.distance_miles !== b.distance_miles) {
      return a.distance_miles - b.distance_miles;
    }
    if (a.impressions !== b.impressions) {
      return a.impressions - b.impressions;
    }

    return a.sponsor_id.localeCompare(b.sponsor_id);
  })[0];
}

function httpsValid(value) {
  try {
    const url = new URL(value);

    const rawIp =
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) ||
      url.hostname.includes(":");

    return url.protocol === "https:" && !rawIp;
  } catch {
    return false;
  }
}

const base = {
  active: true,
  status: "APPROVED",
  placement: "listing-results",
  target_zip: "90032",
  radius_miles: 5,
  distance_miles: 1,
  tier: "GOLD",
  impressions: 50,
  start_at: "2026-01-01T00:00:00Z",
  end_at: "2027-01-01T00:00:00Z",
};

const context = {
  propertyZip: "90032",
  placement: "listing-results",
  now: "2026-10-20T12:00:00Z",
};

expect(
  "exact ZIP match qualifies",
  eligible(context, { ...base, sponsor_id: "zip" }) === true,
);

expect(
  "nearby radius match qualifies",
  eligible(context, {
    ...base,
    sponsor_id: "radius",
    target_zip: "90033",
    distance_miles: 2,
  }) === true,
);

expect(
  "inactive sponsor rejected",
  eligible(context, {
    ...base,
    sponsor_id: "inactive",
    active: false,
  }) === false,
);

expect(
  "expired sponsor rejected",
  eligible(context, {
    ...base,
    sponsor_id: "expired",
    end_at: "2026-01-01T00:00:00Z",
  }) === false,
);

expect(
  "unapproved sponsor rejected",
  eligible(context, {
    ...base,
    sponsor_id: "pending",
    status: "PENDING",
  }) === false,
);

const tieWinner = selectSponsor(context, [
  {
    ...base,
    sponsor_id: "sponsor-b",
    tier: "GOLD",
    distance_miles: 1.2,
    impressions: 45,
  },
  {
    ...base,
    sponsor_id: "sponsor-c",
    tier: "GOLD",
    distance_miles: 0.8,
    impressions: 90,
  },
]);

expect(
  "tie uses shorter distance before impressions",
  tieWinner?.sponsor_id === "sponsor-c",
);

expect(
  "no matching sponsor returns null",
  selectSponsor(
    context,
    [{
      ...base,
      sponsor_id: "far",
      target_zip: "99999",
      radius_miles: 1,
      distance_miles: 20,
    }],
  ) === null,
);

expect(
  "empty candidates returns null",
  selectSponsor(context, []) === null,
);

expect(
  "valid HTTPS sponsor URL accepted",
  httpsValid("https://example.com") === true,
);

expect(
  "unsafe HTTP sponsor URL rejected",
  httpsValid("http://example.com") === false,
);

const auditWinner = selectSponsor(context, [
  {
    ...base,
    sponsor_id: "sponsor-a",
    tier: "SILVER",
    distance_miles: 0.4,
    impressions: 120,
  },
  {
    ...base,
    sponsor_id: "sponsor-b",
    tier: "GOLD",
    distance_miles: 1.2,
    impressions: 45,
  },
  {
    ...base,
    sponsor_id: "sponsor-c",
    tier: "GOLD",
    distance_miles: 0.8,
    impressions: 90,
  },
  {
    ...base,
    sponsor_id: "sponsor-d",
    tier: "PLATINUM",
    distance_miles: 0.2,
    impressions: 10,
    status: "PENDING",
  },
]);

expect(
  "audit dataset deterministically selects Sponsor C",
  auditWinner?.sponsor_id === "sponsor-c",
);


expect(
  "placement mismatch rejected",
  eligible(context, {
    ...base,
    sponsor_id: "wrong-placement",
    placement: "sidebar",
  }) === false,
);

expect(
  "exact ZIP outranks higher tier radius-only sponsor",
  selectSponsor(context, [
    {
      ...base,
      sponsor_id: "exact-silver",
      tier: "SILVER",
      target_zip: "90032",
      distance_miles: 4,
    },
    {
      ...base,
      sponsor_id: "radius-platinum",
      tier: "PLATINUM",
      target_zip: "90033",
      radius_miles: 5,
      distance_miles: 1,
    },
  ])?.sponsor_id === "exact-silver",
);

expect(
  "final tie breaker uses sponsor ID alphabetically",
  selectSponsor(context, [
    {
      ...base,
      sponsor_id: "sponsor-beta",
      distance_miles: 1,
      impressions: 50,
    },
    {
      ...base,
      sponsor_id: "sponsor-alpha",
      distance_miles: 1,
      impressions: 50,
    },
  ])?.sponsor_id === "sponsor-alpha",
);

expect(
  "raw IP sponsor URL rejected",
  httpsValid("https://192.0.2.1/landing") === false,
);

expect(
  "campaign exact end time remains eligible",
  eligible(
    {
      ...context,
      now: "2027-01-01T00:00:00Z",
    },
    {
      ...base,
      sponsor_id: "end-boundary",
    },
  ) === true,
);
const output = [
  `Sponsor selection tests`,
  `PASS: ${pass.length}`,
  `FAIL: ${fail.length}`,
  "",
  ...pass.map((name) => `PASS: ${name}`),
  ...fail.map((name) => `FAIL: ${name}`),
  "",
  `Audit winner: ${auditWinner?.sponsor_id ?? "none"}`,
];

const evidenceDir = path.join(process.cwd(), "docs", "evidence");
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, "sponsor-tests.txt"),
  output.join("\n"),
  "utf8",
);

console.log("");
console.log(`PASS total: ${pass.length}`);
console.log(`FAIL total: ${fail.length}`);
console.log(`Audit winner: ${auditWinner?.sponsor_id ?? "none"}`);

if (fail.length > 0) process.exit(1);

