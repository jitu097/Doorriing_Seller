const toTimestamp = (value) => {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortOrdersByNewest = (orders = []) => (
  [...orders].sort((left, right) => toTimestamp(right?.created_at) - toTimestamp(left?.created_at))
);

export const upsertOrderAtTop = (previousOrders = [], incomingOrder, limit = null) => {
  if (!incomingOrder?.id) {
    return previousOrders;
  }

  const merged = [
    incomingOrder,
    ...previousOrders
      .filter((order) => order?.id !== incomingOrder.id)
      .map((order) => (order?.id === incomingOrder.id ? { ...order, ...incomingOrder } : order))
  ];

  const ordered = sortOrdersByNewest(merged);
  return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
};

export const mergeFetchedOrders = (fetchedOrders = [], previousOrders = [], limit = null) => {
  const previousMap = new Map(previousOrders.map((order) => [order?.id, order]));
  const fetchedIds = new Set();

  const mergedFetched = fetchedOrders.map((order) => {
    fetchedIds.add(order?.id);
    const previous = previousMap.get(order?.id);
    return previous ? { ...previous, ...order } : order;
  });

  const missingPrevious = previousOrders.filter((order) => order?.id && !fetchedIds.has(order.id));
  const ordered = sortOrdersByNewest([...mergedFetched, ...missingPrevious]);

  return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
};
