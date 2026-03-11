import React, { memo, useMemo } from 'react';
import './AssignDriverModal.css';

const AssignDriverModal = ({
  open,
  order,
  drivers = [],
  loading,
  error,
  onClose,
  onAssign,
  onRefresh,
  actionState
}) => {
  if (!open) return null;

  const isAssigning = actionState?.type === 'assign-driver';
  const modalTitle = useMemo(
    () => (order ? `Order #${order.order_number || order.id}` : 'Order details'),
    [order]
  );
  const modalBody = useMemo(() => {
    if (loading) {
      return <div className="assign-driver-modal__state">Loading available drivers…</div>;
    }
    if (drivers.length === 0) {
      return (
        <div className="assign-driver-modal__state">
          No active drivers right now. Refresh the list or try again in a moment.
        </div>
      );
    }
    return drivers.map(driver => (
      <button
        key={driver.id}
        className="assign-driver-modal__card"
        onClick={() => onAssign(driver.id)}
        disabled={isAssigning}
      >
        <div>
          <strong>{driver.name}</strong>
          {driver.vehicle_type && <span>{driver.vehicle_type}</span>}
        </div>
        <div className="assign-driver-modal__contact">
          <span>{driver.phone || 'N/A'}</span>
          <small>Tap to assign</small>
        </div>
      </button>
    ));
  }, [drivers, isAssigning, onAssign, loading]);

  return (
    <div className="assign-driver-modal__backdrop">
      <div className="assign-driver-modal">
        <header>
          <div>
            <p>Assign Driver</p>
            <h3>{modalTitle}</h3>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Close assign driver modal">
            ×
          </button>
        </header>

        <p className="assign-driver-modal__subtitle">
          Choose an active delivery partner to handle pickup and drop-off.
        </p>

        {error && <div className="assign-driver-modal__error">{error}</div>}

        <div className="assign-driver-modal__list">{modalBody}</div>

        <footer>
          <button className="outline" onClick={onRefresh} disabled={loading}>
            Refresh List
          </button>
          <button className="solid ghost" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default memo(AssignDriverModal);
