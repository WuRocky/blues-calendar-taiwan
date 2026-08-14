import { useStorage } from 'nitropack/runtime'
import type { OrganizerEditableEvent, OrganizerEventUpdatePatch } from '~~/lib/line/organizerEventUpdateNotion'
import type { OrganizerEventUpdateFields } from '~~/lib/line/organizerEventUpdateParser'

const STORAGE_NAMESPACE = 'data'
const STORAGE_PREFIX = 'line:organizer-update'
const REQUEST_EXPIRY_MINUTES = 10

interface OrganizerPendingBase {
  createdAt: string
  eventDate: string
  expiresAt: string
  groupId: string
  id: string
  requestUserId: string
}

export interface OrganizerUpdateSelectionRequest extends OrganizerPendingBase {
  candidates: OrganizerEditableEvent[]
  fields: OrganizerEventUpdateFields
  kind: 'selection'
}

export interface OrganizerUpdateConfirmationRequest extends OrganizerPendingBase {
  event: OrganizerEditableEvent
  fields: OrganizerEventUpdateFields
  kind: 'confirmation'
  patch: OrganizerEventUpdatePatch
}

export type OrganizerPendingRequest =
  | OrganizerUpdateSelectionRequest
  | OrganizerUpdateConfirmationRequest

function getStorageKey(requestId: string) {
  return `${STORAGE_PREFIX}:${requestId}`
}

function getOrganizerUpdateStorage() {
  return useStorage(STORAGE_NAMESPACE)
}

export function getOrganizerUpdateRequestExpiryMinutes() {
  return REQUEST_EXPIRY_MINUTES
}

export async function createOrganizerSelectionRequest(
  payload: Omit<OrganizerUpdateSelectionRequest, 'createdAt' | 'expiresAt' | 'id' | 'kind'>
) {
  const now = new Date()
  const request: OrganizerUpdateSelectionRequest = {
    ...payload,
    kind: 'selection',
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + REQUEST_EXPIRY_MINUTES * 60 * 1000).toISOString()
  }

  await getOrganizerUpdateStorage().setItem(getStorageKey(request.id), request)
  return request
}

export async function createOrganizerConfirmationRequest(
  payload: Omit<OrganizerUpdateConfirmationRequest, 'createdAt' | 'expiresAt' | 'id' | 'kind'>
) {
  const now = new Date()
  const request: OrganizerUpdateConfirmationRequest = {
    ...payload,
    kind: 'confirmation',
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + REQUEST_EXPIRY_MINUTES * 60 * 1000).toISOString()
  }

  await getOrganizerUpdateStorage().setItem(getStorageKey(request.id), request)
  return request
}

export async function getOrganizerPendingRequest(requestId: string) {
  const request = await getOrganizerUpdateStorage().getItem<OrganizerPendingRequest>(getStorageKey(requestId))

  if (!request) {
    return null
  }

  if (new Date(request.expiresAt).getTime() <= Date.now()) {
    await getOrganizerUpdateStorage().removeItem(getStorageKey(requestId))
    return null
  }

  return request
}

export async function deleteOrganizerPendingRequest(requestId: string) {
  await getOrganizerUpdateStorage().removeItem(getStorageKey(requestId))
}
