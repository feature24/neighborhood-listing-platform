import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
assert(url && key, "Missing Supabase configuration");
const secrets = [key];
const evidence = [];
mkdirSync("docs/evidence", { recursive: true });

function redact(text) {
  for (const secret of secrets) {
    if (secret) text = text.split(secret).join("[REDACTED]");
  }
  return text;
}

async function request(label, path, {
  token, method = "GET", body, app = false,
} = {}) {
  const target = app ? `http://localhost:3000${path}` : `${url}/rest/v1/${path}`;
  const headers = {
    ...(app ? {} : { apikey: key }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(!app && method !== "GET" ? { Prefer: "return=representation" } : {}),
  };
  const payload = body ? JSON.stringify(body) : undefined;
  const response = await fetch(target, { method, headers, body: payload });
  const raw = await response.text();
  const record = [
    `TEST: ${label}`,
    `${method} ${target}`,
    `Authorization: ${token ? "Bearer [REDACTED TEST USER JWT]" : "absent"}`,
    ...Object.entries(headers)
      .filter(([name]) => name !== "Authorization")
      .map(([name, value]) => `${name}: ${redact(value)}`),
    `Request body: ${payload ?? "(none)"}`,
    `HTTP ${response.status} ${response.statusText}`,
    `Response body: ${redact(raw)}`,
    "",
  ].join("\n");
  evidence.push(record);
  writeFileSync("docs/evidence/rls-tests.txt", evidence.join("\n"));
  let data;
  try { data = JSON.parse(raw); } catch { data = raw; }
  return { status: response.status, data };
}

async function login(email, password) {
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  assert(!error && data.session, `Login failed for ${email}; check password and confirmation`);
  secrets.push(data.session.access_token, data.session.refresh_token);
  return { token: data.session.access_token, id: data.user.id };
}

function passed(label) { console.log(`PASS: ${label}`); }

try {
  const owner = await login("owner@example.com", process.env.TEST_OWNER_PASSWORD);
  const other = await login("other@example.com", process.env.TEST_OTHER_PASSWORD);

  for (const [label, user] of [["owner", owner], ["other", other]]) {
    const existing = await request(`${label} profile lookup`,
      `profiles?user_id=eq.${user.id}&select=user_id`, { token: user.token });
    assert.equal(existing.status, 200);
    if (existing.data.length === 0) {
      const profile = await request(`${label} profile creation`, "profiles", {
        token: user.token, method: "POST",
        body: { user_id: user.id, display_name: `Fictional ${label}` },
      });
      assert.equal(profile.status, 201);
    }
  }

  const publicRead = await request("Anonymous approved read",
    "properties?property_id=eq.demo-property-1&select=property_id");
  assert.equal(publicRead.status, 200);
  assert.equal(publicRead.data.length, 1);
  passed("Anonymous can read approved listing");

  const privateRead = await request("Anonymous hidden read",
    "properties?property_id=eq.demo-private-1&select=property_id");
  assert.equal(privateRead.status, 200);
  assert.deepEqual(privateRead.data, []);
  passed("Anonymous cannot read hidden listing (200 with [])");

  const property = {
    property_id: `rls-test-${crypto.randomUUID()}`,
    user_id: owner.id,
    address: "505 Test Owner Lane",
    city: "Pico Rivera", state: "CA", zip_code: "90660",
    price: 400000, bedrooms: 2, bathrooms: 1,
    square_feet: 1000, amenities: ["Test patio"],
  };

  const anonInsert = await request("Anonymous database insert denied", "properties", {
    method: "POST", body: property,
  });
  assert([401, 403].includes(anonInsert.status));
  assert.equal(anonInsert.data.code, "42501");
  passed("Anonymous database insert denied");

  const create = await request("Owner creates listing", "properties", {
    token: owner.token, method: "POST", body: property,
  });
  assert.equal(create.status, 201);
  passed("Owner creates own unapproved listing");

  const path = `properties?property_id=eq.${property.property_id}`;
  const ownerUpdate = await request("Owner updates own listing", path, {
    token: owner.token, method: "PATCH", body: { price: 410000 },
  });
  assert.equal(ownerUpdate.status, 200);
  assert.equal(ownerUpdate.data.length, 1);
  assert.equal(Number(ownerUpdate.data[0].price), 410000);
  passed("Owner updates own unapproved listing");

  const otherRead = await request("Other user reads owner private listing",
    `${path}&select=property_id`, { token: other.token });
  assert.equal(otherRead.status, 200);
  assert.deepEqual(otherRead.data, []);
  passed("Other user cannot read owner private listing");

  const otherUpdate = await request("Other user update blocked", path, {
    token: other.token, method: "PATCH", body: { price: 1 },
  });
  assert.equal(otherUpdate.status, 200);
  assert.deepEqual(otherUpdate.data, []);

  const unchanged = await request("Owner verifies denied update changed nothing",
    `${path}&select=price`, { token: owner.token });
  assert.equal(unchanged.status, 200);
  assert.equal(Number(unchanged.data[0].price), 410000);
  passed("Other user update affects zero rows; original price preserved");

  const spoof = await request("Other user spoofs owner during insert", "properties", {
    token: other.token, method: "POST",
    body: { ...property, property_id: `spoof-${crypto.randomUUID()}` },
  });
  assert.equal(spoof.status, 403);
  assert.equal(spoof.data.code, "42501");
  passed("Other user cannot insert under owner identity");

  const approve = await request("Owner self-approval denied", path, {
    token: owner.token, method: "PATCH", body: { approved: true },
  });
  assert.equal(approve.status, 403);
  assert.equal(approve.data.code, "42501");
  passed("Owner cannot approve own listing");

  const invalid = await request("App rejects invalid authenticated listing",
    "/api/properties", {
      app: true, token: owner.token, method: "POST",
      body: { address: "Invalid", price: -1 },
    });
  assert.equal(invalid.status, 400);
  passed("App validates authenticated input");

  const { property_id, user_id, ...appInput } = property;
  void property_id;
  void user_id;
  const appCreate = await request("App creates authenticated owner listing",
    "/api/properties", {
      app: true, token: owner.token, method: "POST", body: appInput,
    });
  assert.equal(appCreate.status, 201);
  passed("Authenticated POST route creates listing");

  for (const id of [property.property_id, appCreate.data.property.property_id]) {
    const cleanup = await request("Owner deletes test listing",
      `properties?property_id=eq.${id}`, { token: owner.token, method: "DELETE" });
    assert.equal(cleanup.status, 200);
    assert.equal(cleanup.data.length, 1);
  }
  passed("Owner deletes own unapproved listings");
  console.log("ALL TESTS PASSED. Evidence: docs/evidence/rls-tests.txt");
} catch (error) {
  console.error(redact(error.message));
  process.exitCode = 1;
}