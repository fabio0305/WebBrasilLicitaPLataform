import { Agency } from "../entities/Agency";

export type TimelineRules = { minDays: number; useBusinessDays: boolean };
export type WorkflowRules = { phaseInversionAllowed: boolean; phaseInversionDefault: boolean; phaseInversionConfigurable: boolean };

const STRATEGIES: Record<string, { timeline: TimelineRules; workflow: WorkflowRules }> = {
  LEI_14133: {
    timeline: { minDays: 8, useBusinessDays: true },
    workflow: { phaseInversionAllowed: true, phaseInversionDefault: false, phaseInversionConfigurable: true },
  },
  LEI_13303: {
    timeline: { minDays: 5, useBusinessDays: false },
    workflow: { phaseInversionAllowed: true, phaseInversionDefault: true, phaseInversionConfigurable: false },
  },
  REGULAMENTO_PROPRIO: {
    timeline: { minDays: 3, useBusinessDays: false },
    workflow: { phaseInversionAllowed: true, phaseInversionDefault: false, phaseInversionConfigurable: true },
  },
};

function getStrategy(agency: Agency) {
  return STRATEGIES[agency.legalFramework ?? "LEI_14133"] ?? STRATEGIES["LEI_14133"]!;
}

export function validateTimelineForAgency(agency: Agency, startsAt: Date): { valid: boolean; errorCode: string | null } {
  const { timeline } = getStrategy(agency);
  const diffMs = startsAt.getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < timeline.minDays) return { valid: false, errorCode: "TIMELINE_TOO_SHORT" };
  return { valid: true, errorCode: null };
}

export function resolvePhaseInversionForAgency(agency: Agency, requested: boolean | null): boolean {
  const { workflow } = getStrategy(agency);
  if (!workflow.phaseInversionAllowed) return false;
  if (!workflow.phaseInversionConfigurable) return workflow.phaseInversionDefault;
  return requested ?? workflow.phaseInversionDefault;
}

export function buildProcurementSetupSummary(agency: Agency) {
  const { timeline, workflow } = getStrategy(agency);
  return {
    legalFramework: agency.legalFramework ?? null,
    entityType: agency.entityType ?? null,
    sphere: agency.sphere ?? null,
    timeline,
    workflow,
    security: { csrfProtection: true, auditLogging: true, localCredentials: true },
    pncpPublicationAsync: true,
  };
}
