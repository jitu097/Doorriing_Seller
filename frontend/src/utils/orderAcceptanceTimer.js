const ACCEPTANCE_WINDOW_MINUTES = 5;
export const ACCEPTANCE_WINDOW_MS = ACCEPTANCE_WINDOW_MINUTES * 60 * 1000;
export const TIMER_WARNING_THRESHOLD_MS = 2 * 60 * 1000;
export const TIMER_DANGER_THRESHOLD_MS = 30 * 1000;

const toFiniteNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseTimestampToMs = (value) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const deriveAcceptanceDeadlineMs = (order = {}) => {
  const explicit = parseTimestampToMs(order.acceptance_deadline || order.acceptanceDeadline);
  if (explicit !== null) return explicit;
  const created = parseTimestampToMs(order.created_at || order.createdAt);
  if (created === null) return null;
  return created + ACCEPTANCE_WINDOW_MS;
};

export const deriveInitialRemainingMs = (order = {}) => {
  const provided = toFiniteNumber(order.remaining_time ?? order.remainingTime);
  if (provided !== null) return provided;
  const deadline = deriveAcceptanceDeadlineMs(order);
  if (deadline === null) return null;
  return deadline - Date.now();
};

export const clampRemainingMs = (value) => {
  if (typeof value !== 'number') return null;
  return Math.max(value, 0);
};

export const formatCountdown = (ms) => {
  if (typeof ms !== 'number') return '00:00';
  const safeSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const resolveTimerVariant = (ms) => {
  if (typeof ms !== 'number') return 'neutral';
  if (ms <= TIMER_DANGER_THRESHOLD_MS) return 'danger';
  if (ms <= TIMER_WARNING_THRESHOLD_MS) return 'warning';
  return 'safe';
};

export const isPendingOrderExpired = (order = {}, remainingMs = null) => {
  const status = order.status?.toLowerCase?.() || '';
  if (status !== 'pending') return false;
  if (typeof remainingMs === 'number') return remainingMs <= 0;
  const deadline = deriveAcceptanceDeadlineMs(order);
  if (deadline === null) return false;
  return deadline <= Date.now();
};

export const shouldStartTimer = (order = {}) => {
  const status = order.status?.toLowerCase?.() || '';
  if (status !== 'pending') return false;
  const deadline = deriveAcceptanceDeadlineMs(order);
  if (deadline === null) return false;
  return deadline > Date.now();
};
