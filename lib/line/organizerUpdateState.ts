import { useStorage } from 'nitropack/runtime'
import type { OrganizerEditableEvent, OrganizerEventUpdatePatch } from '~~/lib/line/organizerEventUpdateNotion'
import type { OrganizerEventUpdateFields } from '~~/lib/line/organizerEventUpdateParser'

const STORAGE_NAMESPACE = 'data'
const STORAGE_PREFIX = 'line:organizer-update'
const REQUEST_EXPIRY_MINUTES = 10

export type OrganizerRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'expired'

interface OrganizerPendingBase {
  createdAt: string
  eventDate: string
  expiresAt: string
  groupId: string
  id: string
  requestUserId: string
  status: OrganizerRequestStatus
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

function isExpired(request: OrganizerPendingRequest) {
  return new Date(request.expiresAt).getTime() <= Date.now()
}

async function saveOrganizerPendingRequest(request: OrganizerPendingRequest) {
  await getOrganizerUpdateStorage().setItem(getStorageKey(request.id), request)
}

export async function createOrganizerSelectionRequest(
  payload: Omit<OrganizerUpdateSelectionRequest, 'createdAt' | 'expiresAt' | 'id' | 'kind' | 'status'>
) {
  const now = new Date()
  const request: OrganizerUpdateSelectionRequest = {
    ...payload,
    kind: 'selection',
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + REQUEST_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    status: 'pending'
  }

  await saveOrganizerPendingRequest(request)
  return request
}

export async function createOrganizerConfirmationRequest(
  payload: Omit<OrganizerUpdateConfirmationRequest, 'createdAt' | 'expiresAt' | 'id' | 'kind' | 'status'>
) {
  const now = new Date()
  const request: OrganizerUpdateConfirmationRequest = {
    ...payload,
    kind: 'confirmation',
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + REQUEST_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    status: 'pending'
  }

  await saveOrganizerPendingRequest(request)
  return request
}

export async function getOrganizerPendingRequest(requestId: string) {
  const request = await getOrganizerUpdateStorage().getItem<OrganizerPendingRequest>(getStorageKey(requestId))

  if (!request) {
    return null
  }

  if (request.status === 'pending' && isExpired(request)) {
    const expiredRequest: OrganizerPendingRequest = {
      ...request,
      status: 'expired'
    }

    await saveOrganizerPendingRequest(expiredRequest)
    return expiredRequest
  }

  return request
}

export async function markOrganizerPendingRequestStatus(
  requestId: string,
  status: OrganizerRequestStatus
) {
  const request = await getOrganizerUpdateStorage().getItem<OrganizerPendingRequest>(getStorageKey(requestId))

  if (!request) {
    return null
  }

  const updatedRequest: OrganizerPendingRequest = {
    ...request,
    status
  }

  await saveOrganizerPendingRequest(updatedRequest)
  return updatedRequest
}

export async function deleteOrganizerPendingRequest(requestId: string) {
  await getOrganizerUpdateStorage().removeItem(getStorageKey(requestId))
}
