# Property Data Model

## Minimum Property Facts

### Property Card
- Property ID
- Address
- City
- Price
- Bedrooms
- Bathrooms
- Property image
- Availability status

### Property Detail Page
- All property card information
- Full description
- Square footage
- Property type
- Amenities

### Sponsor Selection
- Sponsor ID
- Sponsor name
- Sponsor category
- Sponsor location

### Voice Response
- Property address
- Price
- Bedrooms
- Bathrooms
- Availability status
## Entities and Relationships

### Property
Represents a property listing. Each property has a unique property ID and contains information such as its address, price, bedrooms, bathrooms, square footage, amenities, and ZIP code.

Primary Key: property_id

### Sponsor
Represents a local business or organization that may sponsor a property listing.

Primary Key: sponsor_id

### PropertySponsor
Connects properties and sponsors. A property can have multiple sponsors, and a sponsor can be associated with multiple properties.

Keys:
- property_id
- sponsor_id

Relationship:
Property ↔ PropertySponsor ↔ Sponsor
## Validation and TypeScript Strategy

The JSON Schema is the source of truth for property validation. It defines the required fields, data types, allowed formats, ranges, and whether additional fields are permitted.

The TypeScript interfaces in `src/types/index.ts` are maintained to match the validated property structure used by the application.

Raw AI-generated records are stored in `data/generated/`. Records that pass validation are stored in `data/validated/`, and the user interface only imports data from the validated folder.