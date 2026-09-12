export interface SampleComplaint { id: string; label: string; fileName: string; tag: string; text: string }

export const SAMPLE_COMPLAINTS: SampleComplaint[] = [
  {
    id: 'email-fdf',
    label: 'Distributor email — discoloured tablets',
    fileName: 'distributor-email-paracetamol.txt',
    tag: 'FDF • Major',
    text: `From: quality@shreelifecare-distributors.in
To: complaints@pharmagen.in
Subject: Complaint - Discolouration in Paracetamol Tablets - Batch PTM-2408
Date: 28 Aug 2026

Dear QA Team,

Customer Name: Shree LifeCare Distributors, Ahmedabad (reported by Mr. R. Patel, 98790 11223).

We received a market complaint for your Product: Paracetamol Tablets IP 650 mg, Batch No: PTM-2408, Mfg Date: 03/2025, Exp Date: 02/2027. Quantity affected: 240 strips (12 boxes) out of 2000 strips supplied.

Complaint description: Pharmacists observed yellowish-brown discolouration and a faint vinegar-like odour in approximately 18 strips. Tablets from the same carton stored at room temperature show spots on the uncoated surface. No adverse event reported so far, but two retailers have quarantined stock and are asking for replacement.

Please investigate on priority and confirm containment action. Photos attached.

Regards,
R. Patel`,
  },
  {
    id: 'phone-sterile',
    label: 'Hospital phone log — particle in injection',
    fileName: 'hospital-phone-log-ceftriaxone.eml',
    tag: 'Sterile FDF • Critical',
    text: `COMPLAINT INTAKE - TELEPHONIC LOG
Complaint Date: 05-09-2026 | Source: Phone call from hospital pharmacy
Customer: CityCare Super Speciality Hospital, Hyderabad - Dr. Anjali Rao (Chief Pharmacist)
Product Name: Ceftriaxone for Injection USP 1000 mg (with Sterile Water for Injection), Strength: 1000 mg/vial, Batch/Lot No: CFX-2511-A, Mfg: Jan 2026, Expiry: Dec 2027
Quantity: 6 vials affected out of 100 vials supplied (Hospital PO H-8821)

Detailed description: While reconstituting for IV administration, nursing staff noticed visible black fibrous particles floating in 2 vials after adding diluent, and 4 more vials show glass-like shining specks under light. Affected vials were immediately quarantined and one patient dose was withheld. No patient was administered the defective vials. Hospital requests urgent replacement and a formal investigation report within 48 hours. Doctor flagged this as a potential sterility/foreign-particle risk for injectable use.

Intake by: QA Officer S. Khan. Priority requested: Urgent.`,
  },
  {
    id: 'api-metformin',
    label: 'QC email — API odour + assay drift',
    fileName: 'api-customer-metformin.pdf.txt',
    tag: 'API • Major',
    text: `From: qc@novachem-api-buyer.com
To: qa@pharmagen.in
Subject: Quality Complaint - Metformin HCl API - Off odour and assay OOS
Complaint Source: Email | Complaint Date: 02 Sep 2026
Customer Name: NovaChem Formulations Pvt. Ltd., Ankleshwar
Product: Metformin Hydrochloride API, Grade: IP / USP, Batch No: MET-API-2603, Manufacturing Date: 2026-04-18, Expiry Date: 2028-04-17
Quantity affected: 3 drums x 25 kg (75 kg) from PO NC-4519 (total 500 kg)

Complaint description: On receipt, QC observed a strong amine-like off-odour from 3 unopened drums and lumps in the powder suggesting moisture uptake. Our assay by HPLC shows 97.1% against the 98.5-101.0% limit (OOS), with total impurities 0.62%. Drum liners appear intact but desiccant sachets were missing in the affected drums. Material is kept under quarantine (QAR-118). Please share CoA, stability data and RCA; we have kept retained samples for joint testing.

Awaiting your investigation plan and CAPA.`,
  },
];
