// ═══════════════════════════════════════════════════════════════
// ShieldVIN — Patent Document Builder
// Generates:
//   patent/dist/ShieldVIN_Patent_Description.docx  ← Full invention description
//   patent/dist/ShieldVIN_CIPC_Provisional.docx    ← CIPC SA provisional filing
//   patent/dist/ShieldVIN_IPO_Provisional.docx     ← UK IPO provisional filing
//
// Run: node patent/build_patent.js
// ═══════════════════════════════════════════════════════════════

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, BorderStyle, Table, TableRow,
  TableCell, WidthType, ShadingType, UnderlineType,
  NumberFormat, Footer, Header, PageNumber
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── COLOURS ──────────────────────────────────────────────────
const NAVY   = '040d1e';
const PURPLE = '6d35e8';
const CYAN   = '00d4ff';
const BLACK  = '111111';
const GRAY   = '5a6a8a';
const LGRAY  = 'eef2ff';
const WHITE  = 'ffffff';

// ── OUTPUT DIR ───────────────────────────────────────────────
const OUT = path.join(__dirname, 'dist');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ═══════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = (n = 1) => Array.from({ length: n }, () =>
  new Paragraph({ children: [new TextRun({ text: '' })] })
);
const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 8 } },
  children: [new TextRun({ text: '' })]
});

const coverTitle = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 },
  children: [new TextRun({ text, bold: true, size: 52, font: 'Calibri', color: NAVY })]
});

const coverSub = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 28, font: 'Calibri', color: GRAY })]
});

const coverMeta = (label, value) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 40 },
  children: [
    new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Calibri', color: BLACK }),
    new TextRun({ text: value, size: 22, font: 'Calibri', color: BLACK }),
  ]
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 120 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE, space: 6 } },
  children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color: NAVY, allCaps: true })]
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 80 },
  children: [new TextRun({ text, bold: true, size: 26, font: 'Calibri', color: PURPLE })]
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 60 },
  children: [new TextRun({ text, bold: true, size: 24, font: 'Calibri', color: BLACK })]
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { after: 160 },
  alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun({ text, size: 22, font: 'Calibri', color: BLACK, ...opts })]
});

const bodyBold = (text) => body(text, { bold: true });

const bullet = (text, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: 'Calibri', color: BLACK })]
});

const numbered = (text, n) => new Paragraph({
  spacing: { after: 120 },
  alignment: AlignmentType.JUSTIFIED,
  children: [
    new TextRun({ text: `${n}.\t`, bold: true, size: 22, font: 'Calibri', color: PURPLE }),
    new TextRun({ text, size: 22, font: 'Calibri', color: BLACK })
  ]
});

const claim = (n, text, isIndependent = false) => new Paragraph({
  spacing: { before: isIndependent ? 200 : 80, after: 120 },
  alignment: AlignmentType.JUSTIFIED,
  children: [
    new TextRun({ text: `${n}. `, bold: true, size: 22, font: 'Calibri', color: isIndependent ? NAVY : GRAY }),
    new TextRun({ text, size: 22, font: 'Calibri', color: BLACK, italics: !isIndependent })
  ]
});

const claimPart = (letter, text) => new Paragraph({
  indent: { left: 720 },
  spacing: { after: 60 },
  alignment: AlignmentType.JUSTIFIED,
  children: [
    new TextRun({ text: `(${letter})\t`, bold: true, size: 22, font: 'Calibri', color: GRAY }),
    new TextRun({ text, size: 22, font: 'Calibri', color: BLACK })
  ]
});

const callout = (text, color = PURPLE) => new Paragraph({
  spacing: { before: 120, after: 120 },
  alignment: AlignmentType.JUSTIFIED,
  border: {
    left: { style: BorderStyle.THICK, size: 12, color, space: 12 },
  },
  shading: { type: ShadingType.CLEAR, fill: 'f8f7ff' },
  children: [new TextRun({ text, size: 22, font: 'Calibri', color: BLACK, italics: true })]
});

const twoColTable = (rows, shade = true) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: PURPLE },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE },
    left: { style: BorderStyle.SINGLE, size: 2, color: 'cccccc' },
    right: { style: BorderStyle.SINGLE, size: 2, color: 'cccccc' },
    insideH: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
    insideV: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
  },
  rows: rows.map(([k, v], i) => new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: shade && i % 2 === 0 ? 'f0eeff' : WHITE },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: 'Calibri', color: NAVY })] })]
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: shade && i % 2 === 0 ? 'fafafe' : WHITE },
        children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: 'Calibri', color: BLACK })] })]
      }),
    ]
  }))
});

// ═══════════════════════════════════════════════════════════
// SHARED CONTENT SECTIONS
// ═══════════════════════════════════════════════════════════

const TITLE = 'SYSTEM AND METHOD FOR CRYPTOGRAPHIC VEHICLE IDENTITY VERIFICATION USING MULTIPLE HARDWARE SECURITY MODULES AND ZERO-KNOWLEDGE PROOFS WITH ROLE-BASED SELECTIVE DISCLOSURE';
const APPLICANT = 'MJ Krugell';
const DATE = '2026';

const sectionField = () => [
  h1('1. Field of the Invention'),
  body('The present invention relates to vehicle identity verification systems, and more particularly to a system and method employing a plurality of tamper-resistant hardware security modules embedded in physically separate structural locations of a motor vehicle at the time of manufacture, combined with zero-knowledge cryptographic proof generation and role-based selective disclosure on a privacy-preserving distributed ledger network, for the purpose of making vehicle identity fraud and Vehicle Identification Number (VIN) cloning permanently impossible.'),
];

const sectionBackground = () => [
  h1('2. Background of the Invention'),

  h2('2.1 The VIN Fraud Problem'),
  body('Motor vehicle identity fraud — commonly known as VIN cloning or VIN fraud — causes estimated global losses exceeding twenty billion United States dollars annually. Vehicle Identification Numbers (VINs) are standardised 17-character alphanumeric codes assigned to each vehicle at manufacture under ISO 3779. These codes appear on stamped metal plates affixed to the vehicle, and are recorded in national registration databases, insurance systems, and vehicle history services.'),
  body('The fundamental vulnerability of the current VIN system is that a VIN is merely a stamped number — it carries no cryptographic proof of its binding to the specific physical vehicle to which it is affixed. Any person with basic metalworking equipment can stamp any VIN onto any plate and attach it to any vehicle. This enables a class of fraud in which a stolen vehicle is given the identity of a legitimate, legally registered vehicle, allowing it to be resold, re-registered, and re-insured as if it were genuine.'),

  h2('2.2 Inadequacy of Existing Systems'),
  body('Existing vehicle history and anti-theft systems are reactive rather than preventive. Systems such as the United States National Motor Vehicle Title Information System (NMVTIS), the United Kingdom\'s HPI Check, and private services such as Carfax operate by accumulating historical records of reported theft, ownership transfers, and damage events. These systems suffer from the following fundamental limitations:'),
  bullet('They rely on timely and accurate reporting by law enforcement, insurers, and government agencies. Fraudulent transactions are frequently not reported before a stolen vehicle is resold.'),
  bullet('They provide no cryptographic binding between the physical vehicle and its recorded identity. A vehicle can be given a cloned VIN plate with no physical modification to any secured component.'),
  bullet('They are inherently retrospective — they can confirm that fraud has occurred, but cannot prevent a transaction from proceeding at the moment of sale.'),
  bullet('They do not distinguish between a physical vehicle and its paper identity, creating a systemic gap that organised criminal networks exploit at scale.'),

  h2('2.3 Prior Blockchain Approaches'),
  body('Proposals to record vehicle history and ownership on public blockchain networks have been made, including projects utilising Ethereum-based tokens (ERC-721 non-fungible tokens) and similar public distributed ledger technologies. These approaches fail to address the VIN fraud problem for the following reasons:'),
  bullet('Public blockchain state is readable by any party. Vehicle identification numbers, ownership records, and query patterns are visible to all network participants, creating privacy violations incompatible with data protection regulations including the General Data Protection Regulation (GDPR) and the Protection of Personal Information Act (POPIA).'),
  bullet('No existing blockchain vehicle identity proposal provides cryptographic hardware binding — a mathematical proof that a specific physical vehicle, not merely its documentation, is present and has not been tampered with.'),
  bullet('Existing proposals treat the VIN as a data field rather than as a hardware-attested cryptographic identity, leaving the fundamental vulnerability — the disconnection between physical vehicle and recorded identity — unresolved.'),

  h2('2.4 Need for the Invention'),
  body('There is a clear and unmet need for a vehicle identity system that: (a) creates an unforgeable cryptographic binding between a physical vehicle and its recorded identity at the point of manufacture; (b) makes this binding dependent on multiple physically separate hardware components such that no single point of failure exists; (c) proves vehicle identity to authorised parties without revealing personal data; and (d) allows different parties to receive only the specific information they are authorised to access, without requiring trust in any centralised authority.'),
  body('The present invention addresses all of these needs.'),
];

const sectionSummary = () => [
  h1('3. Summary of the Invention'),
  body('The present invention provides a vehicle identity verification system and method in which three independent tamper-resistant hardware security modules — hereinafter referred to as the Engine Node (EN-1), the Chassis Node (CN-2), and the Telematics Node (TN-3) — are embedded in physically separate structural locations of a motor vehicle at the point of manufacture. Each hardware security module independently generates its own cryptographic keypair in hardware isolation. No master key, shared secret, or key derivation relationship exists between the three modules.'),
  body('A Vehicle Identity Token is minted on a privacy-preserving distributed ledger at the time of manufacture, recording the three public keys and a hash commitment to the vehicle\'s build specification, without recording any personal identifying information.'),
  body('Vehicle identity verification requires the co-signature of all three hardware security modules on a session-specific challenge nonce. The three signatures are assembled as private witness data and provided to a zero-knowledge proof generation system, which produces a cryptographic proof attesting to the validity of all three signatures against the registered public keys, without revealing the signatures or private keys themselves. This proof is submitted to the distributed ledger for verification.'),
  body('Upon successful verification, a selective disclosure mechanism returns to the requesting party only those vehicle identity fields that are authorised for their specific role. Different roles — including law enforcement, insurers, vehicle dealers, government registration authorities, and the registered owner — receive different subsets of information from the same verification event.'),

  callout('The core innovation of the present invention is the combination of: (1) mandatory multi-location hardware co-signature as a physical proof of vehicle integrity; (2) zero-knowledge proof generation that verifies hardware authenticity without revealing private data; and (3) role-based selective disclosure that returns only authorised fields to each party. No prior art combines these three elements in a vehicle identity context.'),
];

const sectionDrawings = () => [
  h1('4. Brief Description of Drawings'),
  body('The following figures illustrate preferred embodiments of the invention. These figures are schematic representations intended to illustrate the architecture and are not drawn to physical scale.'),
  bullet('Figure 1 — Vehicle side-profile schematic showing the physical locations of EN-1 (engine control unit housing, engine bay), CN-2 (A-pillar structural firewall, body-in-white stage), and TN-3 (telematics module housing, behind dashboard). Encrypted CAN Bus connections between nodes are indicated.'),
  bullet('Figure 2 — Manufacturing and registration flow: vehicle manufacture → key generation in each SE chip → Vehicle Identity Token minting on distributed ledger → token recorded with three public keys and build specification hash.'),
  bullet('Figure 3 — Real-time verification flow: authority query → challenge nonce issued to TN-3 → nonce forwarded to EN-1 and CN-2 → all three nodes sign → witness data assembled → proof server generates ZK proof → Midnight Network validates proof → selective disclosure result returned.'),
  bullet('Figure 4 — Selective disclosure matrix: six stakeholder roles (manufacturer, law enforcement, insurance, dealer, government/DMV, owner) mapped against disclosed and withheld fields for each role.'),
  body('Note to examiner: Figures 1–4 are provided as digital drawings in SVG format accompanying this application. Physical drawings will be supplied in the required format upon request.'),
];

const sectionDetailed = () => [
  h1('5. Detailed Description of Preferred Embodiments'),

  h2('5.1 Hardware Security Module Architecture'),
  body('In the preferred embodiment, three tamper-resistant Secure Element chips, conforming to or exceeding the security requirements of ISO/IEC 15408 (Common Criteria) Evaluation Assurance Level 4 (EAL4+) or equivalent, are embedded into a motor vehicle during the manufacturing process. The three chips are designated:'),

  twoColTable([
    ['Designation', 'Description'],
    ['EN-1 — Engine Node', 'Embedded within the Engine Control Unit (ECU) housing during manufacture. Physically bonded to the ECU\'s internal circuit board such that removal destroys the chip. Located in the engine bay.'],
    ['CN-2 — Chassis Node', 'Embedded into the structural steel of the vehicle\'s A-pillar or firewall during the body-in-white manufacturing stage, before body panels are attached. Cannot be removed without cutting or deforming the structural chassis.'],
    ['TN-3 — Telematics Node', 'Embedded within the telematics module housing, located behind the vehicle dashboard. Serves as the communication coordinator for the verification protocol in addition to its identity function.'],
  ]),

  ...spacer(1),
  body('Each hardware security module independently generates its own Ed25519 elliptic curve keypair within the hardware isolation boundary of the chip at the time of manufacture. The private key is generated and stored exclusively within the hardware security boundary and is never exported, transmitted, or accessible to any external system. No master key, hierarchical key derivation, or Shamir\'s Secret Sharing scheme is employed. The three keypairs are mathematically independent.'),

  h2('5.2 Tamper Detection and Key Destruction'),
  body('Each hardware security module is configured with tamper detection mechanisms appropriate to its physical location:'),
  bullet('EN-1: Monitors for physical breach of the ECU housing, unauthorised electrical access to the ECU bus, and attempts to remove or substitute the ECU assembly. Upon detection of any tamper condition, EN-1 permanently erases its private key and optionally transmits a tamper alert through the TN-3 connectivity channel.'),
  bullet('CN-2: Monitors for structural deformation, cutting, or drilling of the chassis steel in its vicinity, utilising accelerometer and continuity sensing appropriate to embedded structural deployment. Upon detection of a tamper condition, CN-2 permanently erases its private key. Because CN-2 is embedded in structural steel, its removal requires destruction of a structural vehicle component.'),
  bullet('TN-3: Monitors for physical access to the telematics module housing. Upon detection of a tamper condition, TN-3 permanently erases its private key and transmits a tamper alert to the manufacturer\'s monitoring infrastructure through its connectivity module.'),
  body('The destruction of any single module\'s private key permanently invalidates the vehicle\'s ability to generate a valid 3-of-3 co-signature, making the vehicle\'s identity proof permanently impossible to regenerate. This constitutes an irreversible record of tampering on the distributed ledger.'),

  h2('5.3 Vehicle Identity Token Minting'),
  body('At the completion of vehicle manufacture, an authorised manufacturer system mints a Vehicle Identity Token (VIT) on a privacy-preserving distributed ledger. In the preferred embodiment, this ledger is Midnight Network, a privacy-preserving partner chain of the Cardano blockchain, which provides native zero-knowledge proof verification and selective disclosure capabilities through its Compact smart contract language.'),
  body('The Vehicle Identity Token contains the following public on-chain fields:'),
  twoColTable([
    ['Field', 'Content and Privacy Status'],
    ['en1PublicKey', 'Ed25519 public key of EN-1 — public, stored on-chain'],
    ['cn2PublicKey', 'Ed25519 public key of CN-2 — public, stored on-chain'],
    ['tn3PublicKey', 'Ed25519 public key of TN-3 — public, stored on-chain'],
    ['chassisHash', 'SHA-256(chassis serial number + factory salt) — public, stored on-chain'],
    ['engineHash', 'SHA-256(engine serial number + factory salt) — public, stored on-chain'],
    ['buildSpecHash', 'SHA-256 of complete build specification record — public, stored on-chain'],
    ['factoryCode', 'Manufacturer plant identifier — public, stored on-chain'],
    ['mintTimestamp', 'Unix epoch timestamp of manufacture — public, stored on-chain'],
    ['ownershipHash', 'SHA-256(ownerSecret) — hash commitment only, no personal data on-chain'],
    ['status', 'Current vehicle status (ACTIVE/STOLEN/RECOVERED/FLAGGED/DECOMMISSIONED)'],
    ['transferCount', 'Count of ownership transfers — public, stored on-chain'],
    ['serviceCount', 'Count of service events — public, stored on-chain'],
  ]),
  ...spacer(1),
  body('Critically, no Vehicle Identification Number in plaintext, no owner name, no owner address, no wallet address, and no personal identifying information of any kind is stored on the distributed ledger. The ownershipHash field is a cryptographic commitment that can be proven against by a party holding the corresponding ownerSecret, without revealing the secret or any personal identity.'),

  h2('5.4 Verification Protocol'),
  body('When an authorised party initiates a vehicle identity verification, the following protocol is executed:'),
  numbered('The requesting party submits a verification request to the vehicle\'s TN-3 module through the standardised Verification API and Protocol (VAP-1), including the requester\'s role identifier and a freshly generated session nonce.', 1),
  numbered('TN-3 receives the challenge nonce and forwards it to EN-1 and CN-2 via the encrypted Controller Area Network (CAN) bus or equivalent vehicle internal communication protocol.', 2),
  numbered('Each of the three hardware security modules — EN-1, CN-2, and TN-3 — generates an Ed25519 digital signature over the session nonce using its respective private key, within the hardware security boundary of each chip.', 3),
  numbered('TN-3 assembles the three signatures, the three corresponding witness public keys, and the session nonce as private witness data. This witness data is transmitted to a local proof generation server (in the preferred embodiment, a local process implementing the PLONK proof system with KZG polynomial commitments over the BLS12-381 pairing curve and JubJub Edwards curve).', 4),
  numbered('The proof server generates a zero-knowledge proof attesting that: (a) all three signatures are valid Ed25519 signatures over the session nonce; (b) the signing keys correspond to the public keys registered in the Vehicle Identity Token on the distributed ledger; and (c) the vehicle status and role-appropriate fields meet the conditions required for disclosure. The private witness data — the signatures and private keys — is not included in or derivable from the proof.', 5),
  numbered('The zero-knowledge proof and the transaction are submitted to the distributed ledger network for verification. The network verifies the proof against the on-chain Vehicle Identity Token state.', 6),
  numbered('Upon successful verification, the smart contract applies the selective disclosure rules for the requester\'s role and returns only the authorised field values to the requesting party. The total elapsed time for steps 1–7 is targeted at thirty seconds or less for a live proof. Cached public ledger state, available through the network\'s public data indexer without a live zero-knowledge proof, can be returned in under one second for non-authentication queries.', 7),

  h2('5.5 Role-Based Selective Disclosure'),
  body('A core feature of the invention is that different authorised parties receive different subsets of vehicle identity information from the same verification event. This selective disclosure is enforced by the smart contract circuit on the distributed ledger and cannot be bypassed by the requesting party. The following table defines the disclosure rules for each role in the preferred embodiment:'),
  twoColTable([
    ['Role', 'Disclosed Fields'],
    ['Law Enforcement', 'Vehicle status. Vehicle Identification Number disclosed only if status is STOLEN.'],
    ['Insurance', 'Identity validity confirmation, ownership transfer count, service event count.'],
    ['Vehicle Dealer', 'Identity validity confirmation, ownership transfer count, service event count, vehicle status flags.'],
    ['Government / Registration Authority', 'Vehicle status, Vehicle Identification Number, ownership transfer count, recall flags.'],
    ['Registered Owner', 'Full record: VIN, transfer count, service count, manufacture timestamp, build specification hash.'],
    ['Manufacturer', 'Full build data for own fleet, tamper alerts, recall management tools.'],
  ]),
  ...spacer(1),
  body('In all cases, the private witness data — the three hardware signatures, the private keys, and any private vehicle data — is never transmitted to or stored on the distributed ledger. A requesting party cannot reconstruct the private witness data from the zero-knowledge proof even with full access to the proof itself. This architecture provides GDPR Article 25 (data protection by design and by default) compliance by construction rather than by policy.'),

  h2('5.6 Ownership Transfer Protocol'),
  body('Ownership transfer is effected through a smart contract circuit that: (a) verifies that the current owner is the party initiating the transfer, by requiring a zero-knowledge proof that the presenter holds the ownerSecret whose SHA-256 hash matches the on-chain ownershipHash; (b) verifies that the vehicle is in ACTIVE status; and (c) updates the on-chain ownershipHash to a hash commitment provided by the new owner, and increments the transferCount field. The identities of neither the previous nor the new owner are revealed on-chain at any stage of this protocol.'),

  h2('5.7 Lifecycle Status Management'),
  body('The Vehicle Identity Token supports the following lifecycle status transitions, managed by authorised parties through verified smart contract circuits:'),
  bullet('ACTIVE → STOLEN: Initiated by an authorised law enforcement body presenting a valid authority credential.'),
  bullet('STOLEN → RECOVERED: Initiated by an authorised law enforcement body confirming recovery.'),
  bullet('ACTIVE → FLAGGED: Initiated by the manufacturer for recall or administrative hold.'),
  bullet('ACTIVE or RECOVERED → DECOMMISSIONED: Initiated by an authorised party (manufacturer, government, or insurer) for end-of-life, total loss, salvage, or export. Once DECOMMISSIONED, no further identity proofs can be generated.'),

  h2('5.8 Alternative Embodiments'),
  body('While the preferred embodiment describes deployment on Midnight Network using the PLONK proof system and Ed25519 signatures, the invention is not limited to these specific implementations. Alternative embodiments include:'),
  bullet('Use of alternative zero-knowledge proof systems, including but not limited to Groth16, STARK, or Halo2, provided that the selective disclosure and hardware co-signature requirements are preserved.'),
  bullet('Use of alternative elliptic curve signature schemes, including ECDSA over secp256k1 or P-256, provided that the in-chip key generation and tamper detection requirements are preserved.'),
  bullet('Deployment on alternative privacy-preserving distributed ledger networks that provide equivalent zero-knowledge proof verification and selective disclosure capabilities.'),
  bullet('A registry contract architecture in which a single smart contract manages Vehicle Identity Tokens for multiple vehicles using a mapping from vehicle identifier to vehicle record, as an alternative to one contract per vehicle.'),
  bullet('Application to vehicle classes beyond passenger motor vehicles, including commercial vehicles, motorcycles, agricultural machinery, and construction equipment, provided that three physically separate structural locations can be identified for hardware security module embedding.'),
];

const sectionClaims = () => [
  h1('6. Claims'),
  callout('The following claims define the scope of protection sought. Independent claims are presented in standard form. Dependent claims refer to and incorporate the independent claims.'),

  h2('Independent Claims'),

  claim(1, 'A vehicle identity verification system, comprising:', true),
  claimPart('a', 'a first hardware security module (EN-1) embedded within an engine control unit of a motor vehicle at the time of manufacture, the first hardware security module storing a first cryptographic private key generated independently within the hardware security boundary of the first module;'),
  claimPart('b', 'a second hardware security module (CN-2) embedded within the structural chassis of the motor vehicle at the time of manufacture, the second hardware security module storing a second cryptographic private key generated independently within the hardware security boundary of the second module, wherein the second private key is mathematically independent of the first private key and no master key or shared secret exists between the first and second modules;'),
  claimPart('c', 'a third hardware security module (TN-3) embedded within a telematics system of the motor vehicle at the time of manufacture, the third hardware security module storing a third cryptographic private key generated independently within the hardware security boundary of the third module, wherein the third private key is mathematically independent of the first and second private keys;'),
  claimPart('d', 'a verification protocol requiring digital signatures from all three hardware security modules over a session-specific challenge value, wherein the absence or invalidity of any single signature invalidates the identity proof;'),
  claimPart('e', 'a zero-knowledge proof generation component configured to generate a cryptographic proof attesting to the validity of the three digital signatures and their correspondence to public keys registered at manufacture, without revealing the private keys, signatures, or other witness data in the proof or in any data transmitted to the distributed ledger;'),
  claimPart('f', 'a distributed ledger component storing a Vehicle Identity Token comprising the three corresponding public keys and a hash commitment to vehicle build specifications, without storing any plaintext personal identifying information; and'),
  claimPart('g', 'a selective disclosure component configured to return to a requesting party, upon successful verification, only those vehicle identity fields authorised for the role of the requesting party, different roles receiving different subsets of fields from the same verification event.'),

  ...spacer(1),
  claim(2, 'A method for verifying the physical identity of a motor vehicle, comprising the steps of:', true),
  claimPart('a', 'issuing a session-specific challenge nonce to a telematics hardware security module of the vehicle;'),
  claimPart('b', 'forwarding the challenge nonce from the telematics hardware security module to an engine control unit hardware security module and a structural chassis hardware security module of the same vehicle;'),
  claimPart('c', 'generating, within the hardware security boundary of each of the three hardware security modules, a respective digital signature over the challenge nonce using a respective cryptographic private key that was independently generated within each module at the time of manufacture;'),
  claimPart('d', 'assembling the three digital signatures and their corresponding public keys as private witness data, wherein the private witness data does not leave the local system environment;'),
  claimPart('e', 'generating a zero-knowledge proof that attests to the validity of all three digital signatures against the corresponding public keys registered in a Vehicle Identity Token on a distributed ledger, without including the private keys, signatures, or witness data in the proof;'),
  claimPart('f', 'submitting the zero-knowledge proof to the distributed ledger for verification against the Vehicle Identity Token; and'),
  claimPart('g', 'returning to the requesting party a role-specific subset of vehicle identity fields, determined by the authorised role of the requesting party, such that different roles receive different subsets of fields from the same verification event.'),

  ...spacer(1),
  claim(13, 'A vehicle identity token stored on a privacy-preserving distributed ledger, the token comprising:', true),
  claimPart('a', 'a first public key corresponding to a hardware security module embedded in the engine control unit of a motor vehicle;'),
  claimPart('b', 'a second public key corresponding to a hardware security module embedded in the structural chassis of the motor vehicle;'),
  claimPart('c', 'a third public key corresponding to a hardware security module embedded in the telematics system of the motor vehicle;'),
  claimPart('d', 'a cryptographic hash commitment to the vehicle\'s build specification;'),
  claimPart('e', 'a manufacture timestamp;'),
  claimPart('f', 'a cryptographic hash commitment to an initial ownership secret, wherein no wallet address, owner name, or other personal identifying information is stored in plaintext; and'),
  claimPart('g', 'a vehicle status field indicating the current operational status of the vehicle.'),

  h2('Dependent Claims'),

  claim(3, 'The system of claim 1, wherein each hardware security module independently generates its cryptographic private key within the hardware security boundary of that module at the time of vehicle manufacture using a hardware random number generator, such that the private key is never exported from the module and no external party has knowledge of the private key.', false),
  claim(4, 'The system of claim 1, wherein each hardware security module is configured to permanently and irrecoverably erase its stored private key upon detection of at least one tamper condition including: physical breach of the module\'s housing; unauthorised electrical probing of the module\'s interface; removal or attempted removal of the module from its embedded location; and structural deformation of the vehicle component in which the module is embedded.', false),
  claim(5, 'The system of claim 1, wherein the digital signatures are Ed25519 Edwards-curve Digital Signature Algorithm signatures.', false),
  claim(6, 'The system of claim 1, wherein the zero-knowledge proof is generated using a PLONK proof system with Kate-Zaverucha-Goldberg (KZG) polynomial commitments over the BLS12-381 pairing curve and the JubJub Edwards curve.', false),
  claim(7, 'The system of claim 1, wherein the distributed ledger is a privacy-preserving blockchain that maintains structural separation between public ledger state and private witness data, such that private witness data submitted for proof generation is never stored on or transmitted to the distributed ledger network in plaintext form.', false),
  claim(8, 'The system of claim 1, wherein the selective disclosure component is configured such that a law enforcement requester receives a vehicle status indicator and, conditionally, a Vehicle Identification Number only when the vehicle status indicates a stolen status, and does not receive owner identity information, purchase history, or other vehicle identity fields.', false),
  claim(9, 'The system of claim 1, wherein the selective disclosure component is configured such that an insurance requester receives an identity validity confirmation, an ownership transfer count, and a service event count, and does not receive a Vehicle Identification Number, owner identity, or previous owner details.', false),
  claim(10, 'The system of claim 1, wherein the selective disclosure component is configured such that a registered owner requester receives a complete vehicle identity record comprising the Vehicle Identification Number, ownership transfer count, service event count, manufacture timestamp, and build specification hash commitment, upon proof that the requester holds an ownership secret whose cryptographic hash matches the ownership hash commitment stored in the Vehicle Identity Token.', false),
  claim(11, 'The method of claim 2, wherein the challenge nonce is a cryptographically random session-specific value generated fresh for each verification request, such that a signature produced in a prior verification session cannot be reused in a subsequent session.', false),
  claim(12, 'The method of claim 2, wherein public vehicle status information stored in the distributed ledger is readable by authorised parties through a public data indexer without requiring the generation of a zero-knowledge proof, and wherein a zero-knowledge proof is required only for authentication of the physical vehicle through hardware co-signature verification.', false),
  claim(14, 'The vehicle identity token of claim 13, wherein a vehicle status transition from ACTIVE to STOLEN is effectable only by an authorised law enforcement entity presenting a verifiable authority credential through a smart contract circuit on the distributed ledger.', false),
  claim(15, 'The vehicle identity token of claim 13, wherein an ownership transfer is effected by a smart contract circuit that verifies a zero-knowledge proof that the initiating party holds the ownership secret corresponding to the current ownership hash commitment, and upon verification updates the ownership hash commitment to a new commitment provided by the new owner, without revealing the identity of either the current or new owner on the distributed ledger.', false),
];

const sectionAbstract = () => [
  h1('Abstract'),
  body('A vehicle identity verification system and method in which three tamper-resistant hardware security modules — an Engine Node (EN-1) in the engine control unit, a Chassis Node (CN-2) in the structural chassis, and a Telematics Node (TN-3) in the telematics system — are embedded in physically separate locations of a motor vehicle at manufacture. Each module independently generates a cryptographic keypair in hardware isolation with no master key or shared secret. A Vehicle Identity Token minted on a privacy-preserving distributed ledger at manufacture records the three public keys and a build specification hash commitment without storing any personal identifying information. Vehicle identity verification requires co-signatures from all three modules on a session-specific challenge nonce; the signatures are used as private witness data to generate a zero-knowledge proof of hardware authenticity, which is verified on-chain without revealing the witness data. Upon successful verification, a selective disclosure mechanism returns only the vehicle identity fields authorised for the requesting party\'s role — different parties receiving different subsets from the same verification event. Destruction or removal of any single hardware module permanently invalidates the vehicle\'s identity proof capability, making VIN cloning and chassis identity fraud permanently impossible on vehicles equipped with the system.'),
];

// ═══════════════════════════════════════════════════════════
// DOCUMENT 1 — FULL INVENTION DESCRIPTION (shared base)
// ═══════════════════════════════════════════════════════════

async function buildDescription() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: BLACK } }
      }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE, space: 6 } },
            children: [
              new TextRun({ text: 'ShieldVIN — Patent Description', size: 18, font: 'Calibri', color: GRAY }),
              new TextRun({ text: '    |    © 2026 MJ Krugell — CONFIDENTIAL', size: 18, font: 'Calibri', color: GRAY }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'Calibri', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: GRAY }),
            ]
          })]
        })
      },
      children: [
        // Cover
        ...spacer(4),
        coverTitle('ShieldVIN'),
        coverSub('Provisional Patent Application — Full Invention Description'),
        ...spacer(2),
        divider(),
        ...spacer(1),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: TITLE, bold: true, size: 24, font: 'Calibri', color: NAVY })]
        }),
        ...spacer(1),
        divider(),
        ...spacer(2),
        coverMeta('Applicant / Inventor', APPLICANT),
        coverMeta('Date of First Filing', DATE),
        coverMeta('Document Type', 'Provisional Patent Application — Invention Description'),
        coverMeta('Status', 'CONFIDENTIAL — Not for Public Disclosure'),
        ...spacer(2),
        callout('This document constitutes the full invention description supporting provisional patent applications at the Companies and Intellectual Property Commission (CIPC) of South Africa and the UK Intellectual Property Office (IPO). It should be read in conjunction with the accompanying drawings (Figures 1–4).'),

        pageBreak(),

        // Sections
        ...sectionAbstract(),
        pageBreak(),
        ...sectionField(),
        pageBreak(),
        ...sectionBackground(),
        pageBreak(),
        ...sectionSummary(),
        pageBreak(),
        ...sectionDrawings(),
        pageBreak(),
        ...sectionDetailed(),
        pageBreak(),
        ...sectionClaims(),
      ]
    }]
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, 'ShieldVIN_Patent_Description.docx'), buf);
  console.log('✓ ShieldVIN_Patent_Description.docx');
}

// ═══════════════════════════════════════════════════════════
// DOCUMENT 2 — CIPC PROVISIONAL COVER + DESCRIPTION
// ═══════════════════════════════════════════════════════════

async function buildCIPC() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: BLACK } }
      }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'Calibri', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: GRAY }),
            ]
          })]
        })
      },
      children: [
        // CIPC Cover
        ...spacer(2),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'COMPANIES AND INTELLECTUAL PROPERTY COMMISSION', bold: true, size: 28, font: 'Calibri', color: NAVY, allCaps: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Republic of South Africa', size: 22, font: 'Calibri', color: GRAY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Patents Act 57 of 1978', size: 22, font: 'Calibri', color: GRAY, italics: true })]
        }),
        ...spacer(1),
        divider(),
        ...spacer(1),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'PROVISIONAL PATENT APPLICATION', bold: true, size: 32, font: 'Calibri', color: PURPLE, allCaps: true })]
        }),
        ...spacer(1),

        // Filing form table
        twoColTable([
          ['Title of Invention', TITLE],
          ['Applicant Full Name', 'MJ Krugell'],
          ['Applicant Address', '[INSERT: Your full residential/postal address]'],
          ['Applicant Nationality', 'South African'],
          ['Co-Applicants', 'None'],
          ['Inventor(s)', 'MJ Krugell'],
          ['Inventor Address', '[INSERT: Same as above or separate address]'],
          ['Agent / Attorney', '[INSERT: Name and address of patent attorney, or "Self" if filing directly]'],
          ['Agent Address', '[INSERT: If applicable]'],
          ['Priority Claim', 'None (this is the first filing)'],
          ['Related Applications', 'None'],
          ['Date of Filing', '[INSERT: Date you submit this to CIPC]'],
          ['Application Number', '[INSERT: Assigned by CIPC upon receipt]'],
        ]),

        ...spacer(2),
        h2('Filing Instructions — CIPC'),
        body('This document is prepared for provisional patent application at the CIPC under the Patents Act 57 of 1978. A provisional application establishes a priority date but does not grant a patent. You have 12 months from the filing date of this provisional application to file a complete (non-provisional) patent application.'),
        body('Steps to file:'),
        bullet('Complete the P3 form (available at cipc.co.za) using the details in the table above.'),
        bullet('Attach this document (the invention description) to the P3 form.'),
        bullet('Pay the prescribed filing fee (approximately R500–R1,500 — confirm current fee at cipc.co.za/patents).'),
        bullet('File in person at the CIPC office in Pretoria, or by post, or via the CIPC e-Services portal at eservices.cipc.co.za.'),
        bullet('Retain the filing receipt — this document confirms your priority date.'),
        bullet('Within 12 months: file a complete application at CIPC and, if international protection is sought, file at the UK IPO claiming this South African priority date under the Paris Convention.'),
        callout('IMPORTANT: Fields marked [INSERT] must be completed with your actual details before filing. Do not file this document with placeholder text. Consult a registered South African patent attorney (see saiipl.org.za) if you require assistance drafting the claims or completing the forms.'),

        pageBreak(),

        // Declaration
        h1('Declaration'),
        body('I, MJ Krugell, being the inventor and applicant, hereby declare that:'),
        bullet('I am the true and first inventor of the invention described in this application.'),
        bullet('To the best of my knowledge, this invention has not been publicly disclosed, published, or patented prior to the date of this application, except as described in the Background section.'),
        bullet('I am entitled to apply for a patent for this invention.'),
        bullet('All statements made in this application are true to the best of my knowledge and belief.'),
        ...spacer(2),
        body('Signature: _______________________________'),
        body('Full Name: MJ Krugell'),
        body('Date: ___________________________________'),
        body('Place: __________________________________'),

        pageBreak(),
        ...sectionAbstract(),
        pageBreak(),
        ...sectionField(),
        pageBreak(),
        ...sectionBackground(),
        pageBreak(),
        ...sectionSummary(),
        pageBreak(),
        ...sectionDrawings(),
        pageBreak(),
        ...sectionDetailed(),
        pageBreak(),
        ...sectionClaims(),
      ]
    }]
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, 'ShieldVIN_CIPC_Provisional.docx'), buf);
  console.log('✓ ShieldVIN_CIPC_Provisional.docx');
}

// ═══════════════════════════════════════════════════════════
// DOCUMENT 3 — UK IPO PROVISIONAL COVER + DESCRIPTION
// ═══════════════════════════════════════════════════════════

async function buildIPO() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: BLACK } }
      }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'Calibri', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: GRAY }),
            ]
          })]
        })
      },
      children: [
        // IPO Cover
        ...spacer(2),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'INTELLECTUAL PROPERTY OFFICE', bold: true, size: 28, font: 'Calibri', color: NAVY, allCaps: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'United Kingdom', size: 22, font: 'Calibri', color: GRAY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Patents Act 1977', size: 22, font: 'Calibri', color: GRAY, italics: true })]
        }),
        ...spacer(1),
        divider(),
        ...spacer(1),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'PATENT APPLICATION — PATENTS FORM 1', bold: true, size: 32, font: 'Calibri', color: PURPLE, allCaps: true })]
        }),
        ...spacer(1),

        // Filing form table
        twoColTable([
          ['Title of Invention', TITLE],
          ['Applicant Full Name', 'MJ Krugell'],
          ['Applicant Address', '[INSERT: Your full address — must include country]'],
          ['Applicant Nationality', 'South African'],
          ['Co-Applicants', 'None'],
          ['Inventor(s)', 'MJ Krugell'],
          ['Inventor Address', '[INSERT: Same as applicant or separate]'],
          ['Agent / Attorney (UK)', '[INSERT: UK-registered patent attorney name and address, or "None" if filing directly]'],
          ['Priority Application Number', '[INSERT: CIPC application number from your South African filing]'],
          ['Priority Filing Date', '[INSERT: Date of your CIPC filing — must be within 12 months]'],
          ['Priority Country', 'South Africa (ZA)'],
          ['Paris Convention Claim', 'Yes — claiming South African priority under the Paris Convention (Art. 4)'],
          ['Date of UK Filing', '[INSERT: Date you submit this to the UK IPO]'],
          ['UK Application Number', '[INSERT: Assigned by IPO upon receipt]'],
        ]),

        ...spacer(2),
        h2('Filing Instructions — UK IPO'),
        body('This document is prepared for patent application at the UK Intellectual Property Office under the Patents Act 1977. You are claiming priority from your earlier South African CIPC provisional application under the Paris Convention. You must file this UK application within 12 months of your CIPC filing date.'),
        body('Steps to file:'),
        bullet('Complete Patents Form 1 (available at gov.uk/patent-your-invention — search "Patents Form 1"). This is the official application form.'),
        bullet('Complete Patents Form 9A if you wish to request a search at the same time (recommended).'),
        bullet('Attach this document (the invention description with claims) to Form 1.'),
        bullet('Include your CIPC application number and filing date in the priority claim section of Form 1.'),
        bullet('Pay the application fee (£30 online at the time of writing — confirm current fee at gov.uk/patent-your-invention).'),
        bullet('File online at ipo.gov.uk/p-ipsum.htm or by post to: Intellectual Property Office, Concept House, Cardiff Road, Newport, NP10 8QQ.'),
        bullet('For the search request (Form 9A): an additional fee applies (approximately £150 online). The search report will be issued within approximately 6 months and is required for the application to proceed to grant.'),
        callout('IMPORTANT: Fields marked [INSERT] must be completed with your actual details before filing. The Paris Convention priority claim requires your exact CIPC application number and filing date — do not file without these confirmed. Non-UK applicants may file directly without a UK attorney but it is strongly recommended to use a UK-registered patent attorney (see cipa.org.uk) for applications of this complexity. Failure to correctly claim priority from your SA filing may result in loss of the SA priority date.'),

        ...spacer(2),
        h2('Paris Convention Priority — Key Rules'),
        twoColTable([
          ['Rule', 'Detail'],
          ['Filing deadline', 'UK application must be filed within 12 months of the CIPC filing date. Missing this deadline forfeits the SA priority date.'],
          ['Scope of priority', 'The UK application cannot claim priority for any subject matter not disclosed in the SA provisional application. This document must be filed at CIPC first.'],
          ['Coverage', 'A granted UK patent covers England, Scotland, Wales, and Northern Ireland. It does not cover the EU, Ireland, or other territories.'],
          ['Examination', 'The UK IPO will conduct a substantive examination. Grant typically takes 2–4 years from filing. You may respond to examination reports during this process.'],
          ['Annual renewal fees', 'UK patents require annual renewal fees from year 5 onward to remain in force (up to 20 years maximum from filing date).'],
        ]),

        pageBreak(),

        // Declaration
        h1('Declaration (Patents Form 1 — Section 7)'),
        body('I, MJ Krugell, hereby declare that:'),
        bullet('I am the applicant for this patent and I believe that I am entitled to apply for a patent for the invention described in this application.'),
        bullet('I am the inventor of the invention described in this application.'),
        bullet('To the best of my knowledge, the statements made in this application are true.'),
        bullet('I claim priority from patent application number [INSERT CIPC NUMBER] filed in South Africa on [INSERT CIPC DATE].'),
        ...spacer(2),
        body('Signature: _______________________________'),
        body('Full Name: MJ Krugell'),
        body('Date: ___________________________________'),
        body('Address: ________________________________'),

        pageBreak(),
        ...sectionAbstract(),
        pageBreak(),
        ...sectionField(),
        pageBreak(),
        ...sectionBackground(),
        pageBreak(),
        ...sectionSummary(),
        pageBreak(),
        ...sectionDrawings(),
        pageBreak(),
        ...sectionDetailed(),
        pageBreak(),
        ...sectionClaims(),
      ]
    }]
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, 'ShieldVIN_IPO_Provisional.docx'), buf);
  console.log('✓ ShieldVIN_IPO_Provisional.docx');
}

// ═══════════════════════════════════════════════════════════
// BUILD ALL
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('Building patent documents...');
  await buildDescription();
  await buildCIPC();
  await buildIPO();
  console.log('\nAll patent documents written to patent/dist/');
  console.log('\nNext steps:');
  console.log('  1. Complete [INSERT] fields in CIPC and IPO documents with your actual details');
  console.log('  2. File CIPC provisional at cipc.co.za — establishes your priority date');
  console.log('  3. Within 12 months: file IPO application claiming SA priority');
  console.log('  4. Consult a patent attorney before filing (saiipl.org.za / cipa.org.uk)');
}

main().catch(console.error);
