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

let allValid = true;

properties.forEach((property, index) => {
  const valid = validate(property);

  if (valid) {
    console.log(`Property ${index + 1}: PASS`);
  } else {
    allValid = false;
    console.log(`Property ${index + 1}: FAIL`);
    console.log(validate.errors);
  }
});

if (allValid) {
  console.log("\nAll property records passed validation.");

  fs.mkdirSync("data/validated", { recursive: true });

  fs.writeFileSync(
    "data/validated/properties.json",
    JSON.stringify(properties, null, 2)
  );

  console.log("Validated records saved to data/validated/properties.json");
}
const invalidProperty = JSON.parse(
  fs.readFileSync("data/generated/invalid-property.json", "utf8")
);

const invalidResult = validate(invalidProperty);

console.log("\nInvalid property test:");

if (!invalidResult) {
  console.log("PASS - Invalid property was correctly rejected.");
  console.log(validate.errors);
} else {
  console.log("FAIL - Invalid property was incorrectly accepted.");
}