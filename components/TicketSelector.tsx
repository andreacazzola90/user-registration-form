"use client";

import { Box, Stack, TextField, Typography } from "@mui/material";
import type { TicketOption } from "@/lib/types";
import { parseTicketQuantities } from "@/lib/tickets";

type Props = {
  id: string;
  tickets: TicketOption[];
  value: string;
  onChange: (value: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function TicketSelector({ id, tickets, value, onChange }: Props) {
  const quantities = parseTicketQuantities(value);
  const total = tickets.reduce(
    (sum, ticket) => sum + ticket.price * (quantities[ticket.id] ?? 0),
    0,
  );

  function setQuantity(ticketId: string, quantity: number) {
    onChange(
      JSON.stringify({
        ...quantities,
        [ticketId]: Math.min(99, Math.max(0, Math.floor(quantity || 0))),
      }),
    );
  }

  return (
    <Box id={id} tabIndex={-1} sx={{ mt: 1 }}>
      <Stack divider={<Box sx={{ borderTop: "1px dashed #d7dee7" }} />}>
        {tickets.map((ticket) => (
          <Box
            key={ticket.id}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "48px minmax(0, 1fr) 96px",
                sm: "72px minmax(0, 1fr) 110px",
              },
              gap: { xs: 1, sm: 2 },
              alignItems: "center",
              py: { xs: 1.5, sm: 2 },
            }}
          >
            <Box
              component="img"
              src={ticket.imageUrl}
              alt=""
              sx={{
                width: { xs: 48, sm: 72 },
                height: { xs: 48, sm: 72 },
                objectFit: "cover",
                borderRadius: 1,
                border: "1px solid #d7dee7",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#263241",
                  fontSize: { xs: 13, sm: 14 },
                  lineHeight: 1.3,
                }}
              >
                {ticket.title}
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#465568", fontSize: 13 }}>
                {currencyFormatter.format(ticket.price)}
              </Typography>
            </Box>
            <TextField
              label="Quantità"
              type="number"
              size="small"
              value={quantities[ticket.id] ?? 0}
              onChange={(event) => {
                const rawValue = event.target.value;
                const normalizedValue = rawValue.replace(/^0+(?=\d)/, "");
                event.currentTarget.value = normalizedValue;
                setQuantity(ticket.id, Number(normalizedValue));
              }}
              slotProps={{ htmlInput: { min: 0, max: 99, step: 1 } }}
              sx={{
                width: { xs: 96, sm: 110 },
                gridColumn: "auto",
              }}
            />
          </Box>
        ))}
      </Stack>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: 2,
          mt: 0.5,
          borderTop: "1px solid #c4ced9",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Totale</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
          {currencyFormatter.format(total)}
        </Typography>
      </Box>
    </Box>
  );
}