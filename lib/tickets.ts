import type { TicketOption } from "@/lib/types";

export type TicketSelection = {
  quantities: Record<string, number>;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;
};

export function parseTicketQuantities(value: unknown): Record<string, number> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const source =
      parsed && typeof parsed === "object" && "quantities" in parsed
        ? parsed.quantities
        : parsed;

    if (!source || typeof source !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(source).map(([id, quantity]) => [
        id,
        Math.min(99, Math.max(0, Math.floor(Number(quantity) || 0))),
      ]),
    );
  } catch {
    return {};
  }
}

export function normalizeTicketSelection(
  value: unknown,
  tickets: TicketOption[],
): TicketSelection {
  const requestedQuantities = parseTicketQuantities(value);
  const quantities: Record<string, number> = {};
  const items = tickets.flatMap((ticket) => {
    const quantity = requestedQuantities[ticket.id] ?? 0;
    quantities[ticket.id] = quantity;

    if (quantity === 0) {
      return [];
    }

    return [
      {
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        quantity,
        lineTotal: Number((ticket.price * quantity).toFixed(2)),
      },
    ];
  });

  return {
    quantities,
    items,
    total: Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    ),
  };
}

export function formatTicketSelection(value: unknown) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || !("items" in parsed)) {
      return "";
    }

    const selection = parsed as TicketSelection;
    const items = selection.items.map(
      (item) =>
        `${item.title} x ${item.quantity} (${item.lineTotal.toFixed(2)} EUR)`,
    );
    return `${items.join(", ")} - Totale ${selection.total.toFixed(2)} EUR`;
  } catch {
    return "";
  }
}