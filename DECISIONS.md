# DECISIONS.md: Ambiguities & Product Choices

## Ambiguities Resolved

### 1. Ingestion of Utility Billing Cycles
**Ambiguity**: Utility bills rarely align perfectly with calendar months (e.g., April 12 to May 11), creating an accounting overlap for monthly reporting.
**Decision**: I strictly removed proration logic from the ingestion pipeline. 
**Why**: The ingestion layer's sole responsibility is capturing the literal truth of the source document. Calendarization and proration should occur purely as downstream reporting views or BI queries. Splitting a single utility bill into two database rows during ingestion breaks the 1:1 audit linkage to the original invoice.

### 2. SAP Inconsistent Units
**Ambiguity**: SAP configurations frequently mix units (liters vs. kg) depending on the regional plant.
**Decision**: The SAP parser normalizes all volumetric liquid fuels into standard Mass (kg) using specific physical density factors (e.g., 0.84 kg/L for diesel) before applying the emission factor. If an unknown unit is detected, the parser safely rejects the row with a `Failed` status rather than blindly applying a default multiplier.

### 3. Corporate Travel Distance vs Category
**Ambiguity**: Concur/Navan APIs sometimes provide exact distances, but often only provide Airport Codes or general categories.
**Decision**: I built a geodetic lookup dictionary using the Haversine formula for flight routes, calculating the distance dynamically between coordinates if the data only contains origin/destination codes. I also extended the parser to handle general categories (Hotels and Ground Transport) by applying safe proxy multipliers per night/km.

---

## What Was Ignored
- **Currency and Financial Data**: SAP and Concur exports often contain spend data. We deliberately ignored cost columns. Our domain focus is strictly physical activity (kWh, distance, mass) as financial spend-based emission factors are highly inaccurate and subject to inflation distortion.
- **IDoc/BAPI Parsing**: We opted to parse SAP Flat Files (CSV) instead of establishing a direct XML IDoc connection, as an MVP should prove the normalization logic first before tackling SAP NetWeaver networking complexities.

---

## Questions for the Product Manager
If the PM were available, I would ask:
1. **Approval Workflow Limits**: Should a single analyst have the authority to bulk-approve thousands of rows, or do we need a maker-checker (four-eyes) permission model for records exceeding a certain CO2e threshold?
2. **Missing Source Data Policy**: When an SAP export lacks a facility code completely, should we map it to an "Unallocated HQ" bucket so the emissions aren't lost, or reject it outright and force the client to fix their ERP data?
3. **Proration Standard**: For our downstream reporting layer, which ESG reporting framework (e.g., GHG Protocol, SASB) dictates our exact methodology for prorating overlapping utility bills?
