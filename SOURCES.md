# SOURCES.md: Real-World Data Specifications

## 1. SAP Fuel & Procurement Data
**What was researched**: SAP ERP generates procurement exports primarily via ALV grids or direct flat file dumps (CSV/Excel). Alternatively, EDI IDocs or OData services are used.
**What we learned**: SAP is notorious for inconsistent, localized configurations. A German plant might export columns as `Kraftstoffart` while a US plant uses `Fuel`. Furthermore, units of measure vary wildly (e.g., L, Liters, kg, tonnes) and require strict validation.
**Sample Data Logic**: Our sample data simulates an SAP ALV grid export with mixed English/German headers (`Datum`, `Werk`, `Kraftstoffart`) to test our parser's alias mapping capabilities. 
**Real-World Breaking Point**: In a live enterprise, SAP custom Z-tables might introduce undocumented fuel types or internal material IDs that our deterministic parser doesn't recognize. We would need a dynamic, user-configurable mapping interface to handle bespoke material codes.

## 2. Utility Electricity Data
**What was researched**: Facilities teams typically download a CSV from their energy portal (e.g., National Grid) or receive a PDF bill.
**What we learned**: Billing cycles rarely align with calendar months (e.g., 28 days vs 33 days). Meter readings are provided in absolute kWh usage for that specific period.
**Sample Data Logic**: The sample data includes start and end dates with irregular intervals, meter IDs, and kWh usage.
**Real-World Breaking Point**: If a utility provider resets a meter, or if a CSV export includes estimated readings versus actual readings, our parser would currently ingest it all equally. We would need logic to handle meter rollovers and estimated/actual flags.

## 3. Corporate Travel (Concur/Navan)
**What was researched**: Travel management APIs (like SAP Concur) provide itinerary segments.
**What we learned**: Segments often lack distance metrics, providing only IATA airport codes (e.g., LHR to JFK). Furthermore, the emission factor heavily depends on the cabin class (Economy vs First Class) due to floor space taken up on the aircraft.
**Sample Data Logic**: The sample data provides a mix of Flights, Hotels, and Ground transport, with corresponding employee IDs and origin/destination fields. We implemented a geodetic distance calculator to derive km from airport codes.
**Real-World Breaking Point**: The Haversine great-circle distance is an underestimation of actual flight tracks, which often deviate due to weather or airspace restrictions. In a production environment, we would need to apply standard uplift factors (e.g., +8-9% distance penalty) to match strict regulatory auditing standards.
