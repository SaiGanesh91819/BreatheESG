# MODEL.md: Database Schema & Architecture

## Core Philosophy
The data model for this prototype was designed around three non-negotiable principles:
1. **Strict Multi-Tenancy**: Data must be physically isolated per client at the query level.
2. **Immutability of Ledger**: Once an emission record is audited and approved, it becomes computationally immutable.
3. **Traceability**: Every mutation from raw bytes to normalized Carbon equivalent requires a logged transaction.

## Schema Architecture

### 1. `Tenant` and `Facility` (The Isolation Layer)
- **Multi-Tenancy**: The `Tenant` model is the absolute root of all records. A custom Django Middleware (`TenantMiddleware`) intercepts an `X-Tenant-Slug` header and resolves the active context. Every ViewSet enforces strict `.filter(tenant=request.tenant)`. If the header is missing, the API rejects the request or returns an empty queryset. There are no data leaks.
- **Facilities**: The `Facility` model maps raw plant codes (e.g., `Werk-MUC` in SAP) to human-readable names. 

### 2. `RawIngestionLog` (The Source of Truth)
- We never destroy the original payload. The `RawIngestionLog` physically stores the uploaded file via a `FileField` (`raw_file`) in our blob storage alongside an ingestion timestamp. This allows auditors to trace a normalized record back to the exact bytes submitted by the client before any parsing occurred.

### 3. `NormalizedRecord` (The Ledger)
- This is the unified shape for all heterogeneous data (SAP, Utility, Concur).
- **Scope 1/2/3 Categorization**: Deduced during parsing. Fuel (Diesel) maps to Scope 1, Electricity maps to Scope 2, and Corporate Travel maps to Scope 3.
- **Unit Normalization**: The `raw_value` retains the source expression (e.g., "1,500 L Diesel"). The parser normalizes this to standard SI units (e.g., "1,260.00 kg") based on physical density factors, and computes the final `calc_emissions` in metric tonnes of CO2e.
- **Immutability**: The `save()` method is overridden. If a record's status is `Approved`, any attempt to modify its `calc_emissions` or `raw_value` raises a `ValidationError` at the ORM level.

### 4. `AuditTrail` (The Transaction Log)
- Every significant action (Ingestion, Flagging, Approval) creates an `AuditTrail` record tied via ForeignKey to the `NormalizedRecord`.
- It tracks the `timestamp`, the `user_id`, the `action_taken`, and a `delta` JSON field to store exact state changes if a manual override occurs.
