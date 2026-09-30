import fs from "fs";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(
  fs.readFileSync("data/property.schema.json", "utf8")
);

const properties = JSON.parse(
  fs.readFileSync("data/generated/ai-studio-properties.json", "utf8")
);

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);

// Start with a valid property for each test.
const validProperty = properties[0];
const validResult = validate(validProperty);

if (validResult) {
  console.log("PASS - Valid property was accepted.");
} else {
  console.log("FAIL - Valid property was rejected.");
}
const tests = [
  {
    name: "Missing property ID",
    record: (() => {
      const withoutId = { ...validProperty };
delete withoutId.property_id;
return withoutId;
    })(),
  },
  {
    name: "Negative price",
    record: {
      ...validProperty,
      price: -100,
    },
  },
  {
    name: "Bad ZIP code",
    record: {
      ...validProperty,
      zip_code: "ABC12",
    },
  },
  {
    name: "Unknown property field",
    record: {
      ...validProperty,
      unknown_field: "not allowed",
    },
  },
];

for (const test of tests) {
  const valid = validate(test.record);

  if (!valid) {
    console.log(`PASS - ${test.name} was correctly rejected.`);
    console.log(`Reason: ${validate.errors[0].message}`);
  } else {
    console.log(`FAIL - ${test.name} was incorrectly accepted.`);
  }
}