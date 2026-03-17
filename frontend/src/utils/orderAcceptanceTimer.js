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
  let normalizedValue = value;
  // If it's a string and doesn't contain 'Z' or '+' (timezone indicator), append 'Z' to force UTC interpretation
  if (typeof value === 'string' && !value.includes('Z') && !value.includes('+') && !value.includes('T')) {
    normalizedValue = value.replace(' ', 'T') + 'Z';
  } else if (typeof value === 'string' && value.includes('T') && !value.includes('Z') && !value.includes('+')) {
    normalizedValue = value + 'Z';
  }
  const parsed = Date.parse(normalizedValue);
  return Number.isNaN(parsed) ? null : parsed;
};

export const deriveAcceptanceDeadlineMs = (order = {}) => {
  const explicit = parseTimestampToMs(order.acceptance_deadline || order.acceptanceDeadline);
  return explicit; // No fallback to created_at
};

export const deriveInitialRemainingMs = (order = {}, serverTime = null) => {
  const deadline = deriveAcceptanceDeadlineMs(order);
  if (deadline === null) return null;

  // Use serverTime if provided to correct local clock skew
  const now = serverTime ? parseTimestampToMs(serverTime) : Date.now();
  if (now === null) return null;

  const diff = deadline - now;
  return diff > 0 ? diff : 0;
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

export const isPendingOrderExpired = (order = {}, remainingMs = null, serverTime = null) => {
  const status = (order.status || order.order_status)?.toLowerCase?.() || '';
  if (status === 'expired') return true;
  if (status !== 'pending') return false;
  
  if (typeof remainingMs === 'number') return remainingMs <= 0;
  
  const deadline = deriveAcceptanceDeadlineMs(order);
  if (deadline === null) return false;
  
  const now = serverTime ? parseTimestampToMs(serverTime) : Date.now();
  return deadline <= now;
};

export const shouldStartTimer = (order = {}) => {
  const status = (order.status || order.order_status)?.toLowerCase?.() || '';
  if (status !== 'pending' && status !== 'new') return false;
  
  const remaining = deriveInitialRemainingMs(order);
  return typeof remaining === 'number' && remaining > 0;
};
