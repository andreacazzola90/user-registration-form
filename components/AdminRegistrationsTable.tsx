"use client";

import type {
  RegistrationField,
  RegistrationRecord,
  SummaryCardConfig,
  SummaryStats,
} from "@/lib/types";
import {
  getColumnValue,
  getTicketRows,
  type ResolvedColumn,
  type TicketRow,
} from "@/lib/registration-columns";
import { computeSummaryCardValue } from "@/lib/summary-cards";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

type Props = {
  registrations: RegistrationRecord[];
  capacity: number;
  showLabMetrics: boolean;
  fields: RegistrationField[];
  columns: ResolvedColumn[];
  summaryCards: SummaryCardConfig[] | null;
};

function computeSummary(
  registrations: RegistrationRecord[],
  capacity: number,
): SummaryStats {
  const totalChildrenOver3Confirmed = registrations
    .filter((registration) => registration.status === "confirmed")
    .reduce((acc, registration) => acc + registration.children_over_3_labs, 0);

  return {
    totalRegistrations: registrations.length,
    totalChildrenUnder3: registrations.reduce(
      (acc, registration) => acc + registration.children_under_3,
      0,
    ),
    totalChildrenOver3Labs: registrations.reduce(
      (acc, registration) => acc + registration.children_over_3_labs,
      0,
    ),
    totalAdults: registrations.reduce(
      (acc, registration) => acc + registration.adults,
      0,
    ),
    confirmedChildrenOver3Labs: totalChildrenOver3Confirmed,
    remainingSpots: Math.max(capacity - totalChildrenOver3Confirmed, 0),
  };
}

function StatusChip({ registration }: { registration: RegistrationRecord }) {
  return (
    <Chip
      label={registration.status === "confirmed" ? "Confermato" : "Attesa"}
      size="small"
      color={registration.status === "confirmed" ? "success" : "warning"}
      variant="filled"
    />
  );
}

function TicketBreakdown({ rows }: { rows: TicketRow[] }) {
  return (
    <Stack spacing={0} sx={{ minWidth: 220 }}>
      {rows.map((row) => (
        <Box
          key={row.id}
          sx={{
            display: "grid",
            gridTemplateColumns: "28px 1fr auto auto",
            alignItems: "center",
            gap: 1,
            py: 0.5,
            borderBottom: "1px solid #eef2f6",
            "&:last-of-type": { borderBottom: "none" },
          }}
        >
          <Box
            component="img"
            src={row.imageUrl || undefined}
            alt=""
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.5,
              objectFit: "cover",
              backgroundColor: "#eef2f6",
            }}
          />
          <Typography sx={{ fontSize: 13, color: "#2d3943" }}>
            {row.title}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: "#62707c", whiteSpace: "nowrap" }}
          >
            {row.price.toFixed(2)} EUR
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#2d3943",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            x{row.quantity}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function AdminRegistrationsTable({
  registrations,
  capacity,
  showLabMetrics,
  fields,
  columns,
  summaryCards,
}: Props) {
  const summary = computeSummary(registrations, capacity);
  const fillPercent =
    capacity > 0
      ? Math.min((summary.confirmedChildrenOver3Labs / capacity) * 100, 100)
      : 0;
  const hasCustomCards = Boolean(summaryCards && summaryCards.length > 0);

  const titleColumn = columns.find((column) => column.key !== "status");
  const cardColumns = columns.filter(
    (column) => column.key !== titleColumn?.key && column.key !== "status",
  );

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {hasCustomCards ? (
          summaryCards!.map((card) => (
            <Card key={card.id} elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#485560",
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  {card.title.toUpperCase()}
                </Typography>
                <Typography variant="h5" sx={{ color: "#2d3943" }}>
                  {computeSummaryCardValue(card, registrations)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#485560",
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  ISCRIZIONI
                </Typography>
                <Typography variant="h5" sx={{ color: "#2d3943" }}>
                  {summary.totalRegistrations}
                </Typography>
              </CardContent>
            </Card>

            {showLabMetrics && (
              <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#485560",
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    BAMBINI LABORATORI
                  </Typography>
                  <Typography variant="h5" sx={{ color: "#2d3943" }}>
                    {summary.totalChildrenOver3Labs}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {showLabMetrics && (
              <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#485560",
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    ADULTI
                  </Typography>
                  <Typography variant="h5" sx={{ color: "#2d3943" }}>
                    {summary.totalAdults}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {showLabMetrics && (
          <Card
            elevation={0}
            sx={{ border: "1px solid #0f8a84", bgcolor: "#f0fffe" }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography
                sx={{ fontSize: 12, color: "#485560", fontWeight: 700, mb: 1 }}
              >
                DISPONIBILITÀ
              </Typography>
              <Typography variant="h5" sx={{ color: "#0f8a84", mb: 1.5 }}>
                {summary.confirmedChildrenOver3Labs}/{capacity}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={fillPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#dde3ea",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#0f8a84",
                  },
                  mb: 1,
                }}
              />
              <Typography sx={{ fontSize: 12, color: "#62707c" }}>
                Posti rimanenti: {summary.remainingSpots}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #d9dfe7",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {registrations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 192,
              p: 3,
              textAlign: "center",
              color: "#62707c",
            }}
          >
            Nessuna iscrizione al momento. Appena arrivano i primi partecipanti
            li trovi qui.
          </Box>
        ) : (
          <>
            <Box
              sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}
            >
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #dde3ea",
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={`${column.source}:${column.key}`}
                          align={column.align}
                          sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow
                        key={registration.id}
                        sx={{
                          borderBottom: "1px solid #dde3ea",
                          "&:hover": { backgroundColor: "#f8fafc" },
                        }}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={`${column.source}:${column.key}`}
                            align={column.align}
                            sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                          >
                            {column.key === "status" ? (
                              <StatusChip registration={registration} />
                            ) : (
                              (() => {
                                const ticketRows = getTicketRows(
                                  registration,
                                  column,
                                  fields,
                                );
                                return ticketRows ? (
                                  <TicketBreakdown rows={ticketRows} />
                                ) : (
                                  getColumnValue(registration, column, fields)
                                );
                              })()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: { xs: "block", md: "none" }, p: 2 }}>
              <Stack spacing={2}>
                {registrations.map((registration) => (
                  <Card
                    key={registration.id}
                    elevation={0}
                    sx={{ border: "1px solid #d9dfe7" }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: "#2d3943" }}>
                            {titleColumn
                              ? getColumnValue(registration, titleColumn, fields)
                              : ""}
                          </Typography>
                          {columns.some((column) => column.key === "status") && (
                            <StatusChip registration={registration} />
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              sm: "repeat(3, 1fr)",
                            },
                            gap: 1,
                          }}
                        >
                          {cardColumns.map((column) => {
                            const ticketRows = getTicketRows(
                              registration,
                              column,
                              fields,
                            );
                            return (
                              <Box
                                key={`${column.source}:${column.key}`}
                                sx={{
                                  backgroundColor: "#f8fafc",
                                  p: 1.5,
                                  borderRadius: 1,
                                  gridColumn: ticketRows ? "1 / -1" : undefined,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: "#62707c",
                                    fontWeight: 600,
                                  }}
                                >
                                  {column.label}
                                </Typography>
                                {ticketRows ? (
                                  <TicketBreakdown rows={ticketRows} />
                                ) : (
                                  <Typography
                                    sx={{
                                      fontSize: 13,
                                      color: "#2d3943",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {getColumnValue(registration, column, fields)}
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Stack>
  );
}
