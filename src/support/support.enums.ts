export enum SupportTicketStatus {
  OPEN = 'OPEN',
  PENDING_USER = 'PENDING_USER',
  PENDING_ADMIN = 'PENDING_ADMIN',
  CLOSED = 'CLOSED',
}

export const OPEN_SUPPORT_TICKET_STATUSES = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.PENDING_USER,
  SupportTicketStatus.PENDING_ADMIN,
] as const;
