"use server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export type Audit = {
  id: number;
  mission_name: string;
  rocket_name: string;
  agency: string;
  risk_level: string;
  delay_reason: string | null;
  created_at: string;
};

export type PartDispatch = {
  id: number;
  mission_name: string;
  rocket_name: string;
  subsystem: string;
  part_name: string;
  part_number: string;
  supplier_name: string;
  spaceport_pad: string;
  urgency: string;
  status: "DISPATCHED" | "IN_TRANSIT" | "DELIVERED_TO_PAD";
  eta_hours: number;
  notes: string;
  created_at: string;
};

async function ensureTables() {
  try {
    const db = sql();
    await db`
      CREATE TABLE IF NOT EXISTS risk_audits (
        id SERIAL PRIMARY KEY,
        mission_name VARCHAR(255) NOT NULL,
        rocket_name VARCHAR(255) NOT NULL,
        agency VARCHAR(255) NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        delay_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db`
      CREATE TABLE IF NOT EXISTS part_dispatches (
        id SERIAL PRIMARY KEY,
        mission_name VARCHAR(255) NOT NULL,
        rocket_name VARCHAR(255) NOT NULL,
        subsystem VARCHAR(255) NOT NULL,
        part_name VARCHAR(255) NOT NULL,
        part_number VARCHAR(100) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        spaceport_pad VARCHAR(255) NOT NULL,
        urgency VARCHAR(50) NOT NULL DEFAULT 'CRITICAL_AOG',
        status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED',
        eta_hours INT DEFAULT 4,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (e) {
    console.error("ensureTables failed:", e);
  }
}

export async function logRiskAudit(input: {
  mission: string;
  rocket: string;
  agency: string;
  riskLevel: string;
  delayReason: string;
}) {
  try {
    await ensureTables();
    const db = sql();
    await db`
      INSERT INTO risk_audits (mission_name, rocket_name, agency, risk_level, delay_reason)
      VALUES (${input.mission}, ${input.rocket}, ${input.agency}, ${input.riskLevel}, ${input.delayReason});
    `;
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Database connection or write error" };
  }
}

export async function deleteAudit(id: number) {
  try {
    await ensureTables();
    const db = sql();
    await db`DELETE FROM risk_audits WHERE id = ${id}`;
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Database error" };
  }
}

export async function getAudits(): Promise<Audit[]> {
  try {
    await ensureTables();
    const db = sql();
    const rows = await db`
      SELECT id, mission_name, rocket_name, agency, risk_level, delay_reason, created_at::text 
      FROM risk_audits 
      ORDER BY id DESC 
      LIMIT 50
    `;
    return rows as Audit[];
  } catch (e) {
    console.warn("Could not fetch audits from Neon DB:", e);
    return [
      {
        id: 991,
        mission_name: "Starship | Integrated Flight Test 7",
        rocket_name: "Starship Super Heavy",
        agency: "SpaceX",
        risk_level: "HIGH",
        delay_reason: "FAA airspace closure review & Raptor engine static fire telemetry inspection flagged.",
        created_at: new Date(Date.now() - 36e5 * 3).toISOString()
      },
      {
        id: 990,
        mission_name: "SLS Block 1 | Artemis II",
        rocket_name: "Space Launch System Block 1",
        agency: "NASA",
        risk_level: "HIGH",
        delay_reason: "Orion heat-shield ablative margin validation under independent safety review.",
        created_at: new Date(Date.now() - 36e5 * 18).toISOString()
      },
      {
        id: 989,
        mission_name: "Electron | Owl For One",
        rocket_name: "Electron",
        agency: "Rocket Lab",
        risk_level: "MEDIUM",
        delay_reason: "Māhia Peninsula coastal crosswinds forecast at upper limit of flight rules.",
        created_at: new Date(Date.now() - 36e5 * 29).toISOString()
      }
    ];
  }
}

// Supplier Part Dispatch Actions
export async function dispatchSupplierPart(input: {
  mission: string;
  rocket: string;
  subsystem: string;
  partName: string;
  partNumber: string;
  supplierName: string;
  spaceportPad: string;
  urgency: string;
  etaHours: number;
  notes?: string;
}) {
  try {
    await ensureTables();
    const db = sql();
    await db`
      INSERT INTO part_dispatches (
        mission_name, rocket_name, subsystem, part_name, part_number, supplier_name, spaceport_pad, urgency, eta_hours, notes
      ) VALUES (
        ${input.mission}, ${input.rocket}, ${input.subsystem}, ${input.partName}, ${input.partNumber}, ${input.supplierName}, ${input.spaceportPad}, ${input.urgency}, ${input.etaHours}, ${input.notes || ""}
      );
    `;
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to record dispatch in database" };
  }
}

export async function getPartDispatches(): Promise<PartDispatch[]> {
  try {
    await ensureTables();
    const db = sql();
    const rows = await db`
      SELECT id, mission_name, rocket_name, subsystem, part_name, part_number, supplier_name, spaceport_pad, urgency, status, eta_hours, notes, created_at::text
      FROM part_dispatches
      ORDER BY id DESC
      LIMIT 30
    `;
    return rows as PartDispatch[];
  } catch (e) {
    console.warn("Could not fetch dispatches from DB:", e);
    return [
      {
        id: 201,
        mission_name: "Starship | Integrated Flight Test 7",
        rocket_name: "Starship Super Heavy",
        subsystem: "Cryogenic Turbopump & Quick-Disconnect",
        part_name: "Raptor 3 High-Pressure Liquid Methane Seal & Flange",
        part_number: "RP3-QD-8841-B",
        supplier_name: "Valcor Engineering & SpaceX Propulsion Spares",
        spaceport_pad: "Orbital Launch Pad A, Starbase, TX",
        urgency: "CRITICAL_AOG",
        status: "IN_TRANSIT",
        eta_hours: 3,
        notes: "Dedicated air courier departing Brownsville airport with Class 7 certified shipping case.",
        created_at: new Date(Date.now() - 36e5 * 2).toISOString()
      },
      {
        id: 200,
        mission_name: "SLS Block 1 | Artemis II",
        rocket_name: "Space Launch System Block 1",
        subsystem: "Mobile Launcher 1 Ground Umbilical Cryo Valve",
        part_name: "Liquid Hydrogen Mobile Umbilical Bleed Valve Assembly SN-LH2-39B",
        part_number: "SLS-ML1-VALV-412",
        supplier_name: "Moog Space & Defense / Parker Hannifin",
        spaceport_pad: "Launch Complex 39B, KSC, FL",
        urgency: "CRITICAL_AOG",
        status: "DISPATCHED",
        eta_hours: 5,
        notes: "Supplier confirmed acceptance and initiated cleanroom packaging in East Aurora, NY.",
        created_at: new Date(Date.now() - 36e5 * 6).toISOString()
      }
    ];
  }
}

export async function updateDispatchStatus(id: number, status: "DISPATCHED" | "IN_TRANSIT" | "DELIVERED_TO_PAD") {
  try {
    await ensureTables();
    const db = sql();
    await db`UPDATE part_dispatches SET status = ${status} WHERE id = ${id}`;
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Update failed" };
  }
}
