# ShieldVIN — Platform Build Plan
## Full Scope: Portals, Roles, and Feature Sets

**Status:** Planning — pre-development  
**Date:** 2026-04-03  
**Purpose:** Complete feature inventory for all portals and roles before development begins

---

## Overview — The 5 Portals + 1 API Surface

ShieldVIN has six distinct access surfaces, each serving a different set of users with different permissions and UX requirements.

| Surface | URL | Who Uses It | Billing Model |
|---------|-----|-------------|---------------|
| **Government Portal** | gov.shieldvin.org | Government agencies, DMV, law enforcement | Enterprise contract |
| **Manufacturer Portal** | manufacturer.shieldvin.org | OEMs, plant operators, recall coordinators | Per-vehicle minting fee + onboarding |
| **Dealer & Service Portal** | dealer.shieldvin.org | Authorised dealers, service centres | Monthly subscription |
| **Owner Portal** | my.shieldvin.org | Registered vehicle owners | $5 per transfer; 1 free check/month |
| **Verification API** | api.shieldvin.org | Insurers, finance lenders, fleet operators | Per-query API fee |
| **VGM-1 Admin Console** | admin.shieldvin.org | ShieldVIN internal + consortium governance | Internal only |

---

## PORTAL 1 — Government Portal
### gov.shieldvin.org

**Users:** DVLA (UK), DMV (US states), transport ministries, border agencies, national police forces  
**VAP-1 Roles:** `government`, `law_enforcement`  
**Billing:** Enterprise contract per jurisdiction — one-time integration fee + annual maintenance. Never per-query.  
**UX Style:** Professional utility. Dense information display. Dark/light mode. Mobile-friendly for roadside use.

---

### Role A — Government / DMV Officer

**Primary use cases:** Vehicle registration, import/export checks, compliance queries, fleet management, jurisdiction reporting

#### Features

| # | Feature | Description |
|---|---------|-------------|
| G1 | **VIN Lookup — Cached** | Instant (<1 second) status check. Returns: ACTIVE / STOLEN / FLAGGED / RECOVERED / DECOMMISSIONED. For routine volume queries where speed is more important than live chip proof. |
| G2 | **VIN Lookup — Live ZK Proof** | Full 3-of-3 chip proof (≤30 seconds). Confirms the physical vehicle matches its registered VIT. Used for import/export checks, registration of high-value vehicles, suspected fraud. |
| G3 | **Vehicle Detail View** | Full public record: VIN, status, factory code, mint date, transfer count, service count, last recorded mileage, last service timestamp, node rotation history, recall flag status. |
| G4 | **Stolen Flag — File Report** | Officer files a stolen report against a VIN. Calls `flagStolen()` — sets status=STOLEN on-chain instantly. Visible to all roles on any subsequent query. |
| G5 | **Recovered Flag** | Clear a stolen flag after vehicle is recovered. Calls `markRecovered()` — sets status=RECOVERED. |
| G6 | **Fleet / Batch Query** | Upload a CSV of VINs for bulk status check. Returns results as a table. Use cases: import inspection, border crossing fleet, fleet compliance check. Export to CSV/PDF. |
| G7 | **Jurisdiction Dashboard** | Aggregate statistics for this agency's jurisdiction: total enrolled VINs, ACTIVE / STOLEN / FLAGGED / RECOVERED / DECOMMISSIONED counts, mileage distribution, monthly query volume. Charts and trend lines. |
| G8 | **Recall Visibility** | View all VINs currently under recall flag within the jurisdiction. Filter by manufacturer, model, date range. |
| G9 | **Node Rotation Log** | Read-only view of all vehicles that have undergone a hardware node key rotation — i.e., had a chip replaced. Relevant for registration and provenance checks. |
| G10 | **Evidence Pack Export** | Generate a signed evidence pack (PDF + proof hash + proof timestamp) for use in prosecution. Chain of custody documented. Downloadable. |
| G11 | **Audit Log** | Read-only view of all queries made by this agency's credentials. Date, VIN queried, result, user, proof type (cached vs live). |
| G12 | **User Management** | Agency admin can add/remove officer credentials. Role assignment: agency_admin, officer, read_only. |

---

### Role B — Law Enforcement Officer

**Primary use cases:** Roadside checkpoint, stolen vehicle check, investigation, evidence gathering

All Government features above are available. Law enforcement officers additionally have:

| # | Feature | Description |
|---|---------|-------------|
| L1 | **Mobile-Optimised Roadside View** | Single-VIN lookup optimised for mobile browser or dedicated app. Large result display. Instant cached check. One-tap live proof trigger for suspected fraud. |
| L2 | **Stolen Disclosure** | When status=STOLEN, the `verifyPolice()` circuit additionally discloses the VIN (for cross-referencing with national registration databases). Non-stolen vehicles: VIN is withheld from the proof. |
| L3 | **Quick Report — Stolen** | Streamlined one-screen stolen report filing. Officer enters VIN, confirms, submits. On-chain flag set within seconds. |
| L4 | **Evidence Pack (Officer)** | Simplified evidence pack for roadside use: verification result, timestamp, proof reference, officer credential reference. Formatted for court submission. |

---

## PORTAL 2 — Manufacturer Portal
### manufacturer.shieldvin.org

**Users:** OEM manufacturing plant operators, quality assurance teams, recall coordinators, fleet administrators, API/credential managers  
**VAP-1 Role:** `manufacturer` — scoped to their own fleet (factoryCode enforced on all operations)  
**Billing:** Per-vehicle minting fee (Stream 1) + one-time onboarding contract. No per-query fee.  
**UX Style:** Enterprise dashboard. Data-heavy. Bulk operations. CSV/Excel export throughout.

#### Features

| # | Feature | Description |
|---|---------|-------------|
| M1 | **Mint New VIT — Single** | End-of-line minting workflow for one vehicle. Enter VIN, chip public keys (en1, cn2, tn3), buildSpecHash, factoryCode, mileage unit (km/miles). Calls VAP-1 mint endpoint. Returns mintingReceipt. |
| M2 | **Mint New VIT — Batch** | Upload a CSV of vehicles for batch minting. Progress indicator. Error report for any failed mints. Minting receipt log. Used for high-volume production lines. |
| M3 | **Fleet Dashboard** | Real-time view of all VINs minted by this manufacturer. Status breakdown chart (ACTIVE / STOLEN / FLAGGED etc.), tamper alert count, recall flag count, total minted, monthly minting volume. Filter by plant, model line, date range. |
| M4 | **Vehicle Detail View** | Full record for any VIN in this manufacturer's fleet: all ledger fields, full event history, node rotation log, recall history, service count, mileage. |
| M5 | **Recall Management — Issue** | Issue a recall flag to a batch of VINs. Select by: date range, model line, factory code, or upload VIN list. Preview affected count before confirming. Calls `setRecallFlag()` per VIT. |
| M6 | **Recall Management — Clear** | Clear recall flags after service completion. Batch clear or per-VIN. Calls `clearRecallFlag()`. Status restored to ACTIVE. |
| M7 | **Tamper Alert Monitor** | Real-time feed of TN-3 tamper alerts for this manufacturer's fleet. Alert details: VIN, chip that triggered, timestamp, current status. Acknowledge and escalate workflow. |
| M8 | **Hardware Recovery — Authorise** | OEM authorisation step in the VAP-1 node key rotation procedure. Approve the replacement chip's new public key for a specific VIN. Part of the multi-party recovery workflow documented in hardware-recovery.md. |
| M9 | **Build Record Linkage** | Upload or enter a buildSpecHash for a VIN or batch — links the on-chain VIT to the off-chain build specification record. Enables third-party verification of build spec integrity. |
| M10 | **Production Statistics** | Minting volume by month, plant, model line. DUST consumption tracker (internal cost visibility). Monthly cost tracking. Export to Excel. |
| M11 | **Dealer Credential Management** | Issue and revoke VAP-1 dealer role credentials for authorised dealerships in this manufacturer's network. View active dealer credentials, last activity, query volume. |
| M12 | **API Credential Management** | Generate and manage API keys for ERP or third-party system integration. Set rate limits per key. View usage logs per key. |
| M13 | **Staff Role Management** | Add/remove manufacturer portal users. Roles: plant_operator (mint only), recall_coordinator (recall management), fleet_admin (read-only fleet view), portal_admin (full access). |
| M14 | **Billing & Invoice View** | View current month minting volume, projected invoice, previous invoices. Download PDF invoices. Payment method management. |

---

## PORTAL 3 — Dealer & Service Portal
### dealer.shieldvin.org

**Users:** OEM-authorised dealers, used vehicle dealers, service centres, MOT/inspection stations  
**VAP-1 Roles:** `dealer`, `service_centre` — same subscription tier, different feature access  
**Billing:** Monthly subscription $199–$599/month by tier. All operations included.  
**UX Style:** Clean and transactional. Single-VIN workflow. Printable certificates. Customer-facing outputs.

---

### Role A — Dealer

**Primary use cases:** Pre-purchase identity check, new/used vehicle ownership transfer, finance verification, customer handover

#### Features

| # | Feature | Description |
|---|---------|-------------|
| D1 | **VIN Identity Check — Cached** | Instant status check before accepting a trade-in or completing a sale. Returns status, transfer count, service count, last mileage, last service date. |
| D2 | **VIN Identity Check — Live Proof** | Full 3-of-3 chip proof for high-value or suspected-fraud scenarios. Confirms the physical vehicle matches its VIT. `verifyDealer()` circuit. |
| D3 | **Vehicle History View** | Full on-chain record displayed in a customer-friendly format: status, number of previous owners, full service count, verified mileage, mint date (age of token), recall history, node rotation history. |
| D4 | **Ownership Transfer — New Vehicle** | Execute first ownership transfer from OEM to buyer. Input: buyer's commitment hash (generated from Owner App or entered by buyer). Calls `transferOwnership()`. Receipt generated. |
| D5 | **Ownership Transfer — Used Vehicle** | Seller provides ownership proof (from Owner App). Buyer generates new commitment. Dealer submits transfer. transferCount incremented. Receipt generated for both parties. |
| D6 | **Finance Verification Pack** | Generate a proof pack for a vehicle finance application: identity verification result, ownership proof, mileage verification, service count. Formatted for lender submission. |
| D7 | **QR Code Generator** | Generate a VAP-1 verification QR code for display on a vehicle for sale. Links to a live status page. Time-limited or permanent options. Printable for windscreen display. |
| D8 | **Vehicle Identity Certificate** | Print-ready certificate for customer handover: VIN, minting date, factory code, current mileage (verified), service count, transfer count, ShieldVIN verification reference. |
| D9 | **Hardware Recovery — Initiate** | Dealer-side initiation of node key rotation for warranty or recall chip replacement. Collects surviving node signatures. Passes to OEM for authorisation. |
| D10 | **Staff Credential Management** | Add/remove dealership staff. Roles: sales (transfers + checks), service (service recording + checks), admin (full access). |
| D11 | **Audit Log** | All queries and transactions made by this dealership's credentials. Date, VIN, action, user, result. |
| D12 | **Billing & Subscription** | Current subscription tier, renewal date, payment method. Usage summary (queries, transfers this month). Invoice history. |

---

### Role B — Service Centre

Service centres share the same portal and subscription tier as dealers. They have access to identity checks and service recording, but not ownership transfer or finance tools.

| # | Feature | Description |
|---|---------|-------------|
| S1 | **VIN Identity Check — Cached** | Instant status check before beginning service work. Confirms vehicle is ACTIVE and chips are responsive. |
| S2 | **VIN Identity Check — Live Proof** | Full chip proof for vehicles with suspected tamper history or flagged status. |
| S3 | **Record Service Event** | Core service centre action. Enter VIN, odometer reading (mileage), service date. Calls `recordService(mileage, serviceTimestamp)`. Increments serviceCount on-chain. Updates lastRecordedMileage and lastMilestoneTimestamp. Anti-rollback enforced — mileage cannot be less than last recorded reading. |
| S4 | **Service History View** | View the vehicle's full on-chain service record: serviceCount, all mileage readings, timestamps. Useful for checking prior service history before beginning work. |
| S5 | **Recall Status Check** | Check whether a vehicle is currently under a recall flag. If FLAGGED, display recall details from manufacturer. |
| S6 | **Hardware Recovery — Initiate** | Same as dealer: initiate a node key rotation for a chip being replaced under warranty or recall. |
| S7 | **Staff Credential Management** | Add/remove service centre staff. Single role: technician (service recording + checks). |

---

## PORTAL 4 — Owner Portal
### my.shieldvin.org

**Users:** Registered private vehicle owners  
**VAP-1 Role:** `owner` — scoped to vehicles where the caller can prove ownership (knows the ownerSecret preimage)  
**Billing:** $5 per private ownership transfer. 1 free identity check per month included. No subscription.  
**UX Style:** Consumer-grade. Simple, friendly, minimal jargon. Mobile-first. Works without a crypto wallet or browser extension.

#### Features

| # | Feature | Description |
|---|---------|-------------|
| O1 | **My Vehicles** | List of all vehicles linked to this owner's credential. Each shows: registration plate (user-entered for display), status badge, last verified mileage, quick action buttons. |
| O2 | **Vehicle Identity Card** | Full on-chain record for one vehicle: status, transfer count (number of previous owners), service count, verified mileage, last service date, mint date, factory code, recall status, node rotation history. Clean, readable layout. |
| O3 | **Monthly Free Identity Check** | 1 free identity check per month per owner account. Used to verify your own vehicle's current status. Free allowance indicator shown. Additional checks billed at API rate. |
| O4 | **Ownership Proof — Generate** | Owner generates a ZK ownership proof confirming they hold the current ownershipHash preimage. Used at point of sale to prove to a dealer or buyer that they are the registered owner. Output: a signed proof reference, time-limited (e.g. 24 hours). |
| O5 | **Report Stolen** | Owner-initiated stolen report. Owner proves ownership first (O4), then submits stolen report. Calls `flagStolen()` — status=STOLEN set on-chain. |
| O6 | **Share Verification QR** | Generate a time-limited QR code for a prospective buyer. Links to a public status page showing status, mileage, service count, transfer count. No personal data exposed. Expiry: user-selectable (1 hour / 24 hours / 7 days). |
| O7 | **Transfer Vehicle — Initiate (Private Sale)** | Owner initiates a private ownership transfer. Generates an ownership proof. Enters buyer's commitment hash (shared by buyer via Owner App). Pays $5 transfer fee via card / Apple Pay / Google Pay. Calls `transferOwnership()`. |
| O8 | **Transfer Vehicle — Dealer Sale** | Owner generates their proof and a transfer authorisation reference. Dealer completes the transfer via the Dealer Portal. No fee for dealer-mediated sales. |
| O9 | **Notifications** | Push / email alerts for: recall flag set on this vehicle, tamper alert triggered, status change (any direction), service event recorded. Opt-in per notification type. |
| O10 | **Document Pack Download** | Download a signed PDF: vehicle identity certificate + ownership proof + service summary. Useful for insurance applications, finance, private sale listings. |
| O11 | **Credential Management** | Manage the device-bound owner credential (the ownerSecret / commitment). View linked devices. Option to generate a new commitment (ownership proof transition). |
| O12 | **Billing** | View transfer fee history. Payment method management. Monthly free check usage indicator. |

---

## SURFACE 5 — Verification API
### api.shieldvin.org

**Users:** Insurance companies, finance lenders, fleet operators — accessed programmatically (no portal UI for queries)  
**VAP-1 Role:** `insurer` (covers both insurance and finance lender use cases)  
**Billing:** Per-query. Ownership verify $1.75–$2.50. Status check $0.15–$0.35. Tamper check $6–$12. Monthly invoice via card or direct debit.  
**Interface:** REST/JSON API (VAP-1 spec). API key authentication. SDK clients for common languages.

#### API Endpoints

| Endpoint | Description | Returns |
|----------|-------------|---------|
| `GET /v1/vehicle/{vin}/status` | Cached status check | status, lastUpdated |
| `POST /v1/vehicle/{vin}/verify` | Live ZK proof — insurer role | status, transferCount, serviceCount, lastRecordedMileage, lastMilestoneTimestamp |
| `GET /v1/vehicle/{vin}/mileage` | Latest verified mileage + timestamp | lastRecordedMileage, lastMilestoneTimestamp, serviceCount |
| `GET /v1/vehicle/{vin}/history` | Ownership and service event summary | transferCount, serviceCount, mintTimestamp |

#### API Portal Dashboard (web UI for API customers)

| # | Feature | Description |
|---|---------|-------------|
| A1 | **API Key Management** | Generate, rotate, and revoke API keys. Set per-key rate limits. Label keys by system/team. |
| A2 | **Usage Dashboard** | Queries this month by endpoint type. Cost tracker. Month-over-month trends. |
| A3 | **Billing** | Current month estimate, previous invoices, payment method, spend alerts. |
| A4 | **Webhook Configuration** | Configure webhooks for status change events on enrolled VINs (e.g. a vehicle in a live policy changes to STOLEN). |
| A5 | **Enrolled VIN Management** | Add VINs to a watch list for status-change webhooks. Insurers enrol policy vehicles; lenders enrol financed vehicles. |
| A6 | **Documentation** | Embedded API reference (OpenAPI spec), code examples, SDK downloads (JavaScript, Python, Java). |
| A7 | **Sandbox Environment** | Test API access against a testnet deployment with dummy vehicles. No charge for sandbox queries. |

---

## SURFACE 6 — VGM-1 Admin Console
### admin.shieldvin.org

**Users:** ShieldVIN internal operations team + VGM-1 consortium governance members  
**Access:** Internal only — not publicly accessible  
**Purpose:** Governance, credential issuance, system health, DUST reserve management

#### Features

| # | Feature | Description |
|---|---------|-------------|
| V1 | **Credential Issuance** | Issue VAP-1 role credentials to new consortium members (manufacturers, government agencies, insurance companies). Set role, permissions, rate limits, expiry. |
| V2 | **Consortium Member Management** | View all active consortium members. Suspend or revoke access. Audit log of all credential actions. |
| V3 | **Rate Limit Management** | Set and adjust API rate limits per organisation and per credential. Emergency throttle controls. |
| V4 | **DUST Reserve Monitor** | Current DUST balance. Estimated runway at current consumption rate. Low-balance alerts. Transaction fee history by operation type (mint, transfer, service, flag). |
| V5 | **System Health Dashboard** | Midnight Network node connectivity. Proof server status. Indexer latency. API response times. Error rates by endpoint. |
| V6 | **On-Chain Activity Log** | All VIT transactions across the entire network (not scoped to one organisation). Searchable by VIN hash, transaction type, date range. |
| V7 | **Incident Management** | Log and track system incidents. Escalation workflow. Post-incident review notes. |
| V8 | **Billing Administration** | View all customer accounts, subscription status, outstanding invoices, payment failures. Trigger manual billing actions. |
| V9 | **Governance Voting** | VGM-1 consortium governance proposals. Vote on standard updates, fee schedule changes, new member admissions. Audit trail. |

---

## Cross-Portal Features (All Portals)

These apply across every portal.

| Feature | Description |
|---------|-------------|
| **VAP-1 JWT Authentication** | Device-bound credential stored in browser credential store. No username/password database. Credential issued by ShieldVIN at onboarding. |
| **Dark / Light Mode** | All portals support both modes. Government portal defaults to light for official document compatibility. Others default to dark (brand standard). |
| **Mobile Responsive** | All portals work on mobile browsers. Government and Owner portals are specifically optimised for mobile-first workflows. |
| **Session Audit Trail** | Every query and write action is logged with credential, timestamp, VIN, action, and result. Accessible in each portal's audit log. |
| **Proof Certificate PDF** | Any live ZK proof result can be exported as a signed PDF certificate (proof reference, result, timestamp, credential reference). |
| **Status Badge System** | Consistent status badges across all portals: ACTIVE (green), STOLEN (red), FLAGGED (amber), RECOVERED (blue), DECOMMISSIONED (grey). |
| **Multi-Language (Phase 3)** | English (Phase 1). French, German, Mandarin, Japanese added at Phase 3 (multi-jurisdiction scale). |

---

## Build Priority Order

Based on revenue priority and pilot programme design:

### Phase 1 — Foundation (pre-pilot)
1. **Manufacturer Portal** — minting workflow, fleet dashboard (needed before any vehicle can be enrolled)
2. **Government Portal** — VIN lookup, stolen flag (needed for pilot law enforcement partner)
3. **Verification API** — status check + ownership verify endpoints (needed for insurer pilot partner)
4. **Shared infrastructure** — VAP-1 auth, backend API gateway, Midnight.js 4.x integration, proof server

### Phase 2 — Pilot (10–20k vehicles, UK)
5. **Dealer & Service Portal** — identity check, ownership transfer, service recording with mileage
6. **Owner Portal** — vehicle identity card, ownership proof, share QR, transfer initiation
7. **Law Enforcement mobile view** — optimised roadside interface within Government Portal
8. **API Portal Dashboard** — usage, billing, webhook config for insurer pilot partners

### Phase 3 — Scale
9. **VGM-1 Admin Console** — full governance tooling
10. **Manufacturer Portal** — ERP integration API, advanced recall tooling
11. **Government Portal** — batch/fleet query, border agency tools, multi-jurisdiction
12. **All portals** — multi-language, accessibility audit, performance hardening

---

## Open Design Decisions

These need to be resolved during Phase 1 design before building begins:

| Decision | Options | Impact |
|----------|---------|--------|
| Owner credential model | TN-3 device-bound vs app-stored key vs both | Determines Owner Portal auth architecture |
| Law enforcement mobile | PWA (fast to deploy) vs native iOS/Android (biometric auth) | Separate build track if native |
| Proof server deployment | Cloud-hosted (ShieldVIN manages) vs vehicle-local (TN-3 runs it) | Affects latency and offline capability |
| Contract architecture | One-per-vehicle vs registry — **QUESTION 3 in midnight-review-questions.md** | Defines entire backend data model |
| Service centre sub-role | Separate credentials from dealers vs same credential with feature flags | Determines portal access control design |

---

*This document is the planning reference for the ShieldVIN platform build. Feature sets are subject to revision based on Midnight Network technical review answers (see `midnight-review-questions.md`) and pilot programme feedback.*
