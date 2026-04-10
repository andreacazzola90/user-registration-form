"use client";

import type { RegistrationRecord, SummaryStats } from "@/lib/types";
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

export function AdminRegistrationsTable({ registrations, capacity }: Props) {
  const summary = computeSummary(registrations, capacity);
  const fillPercent =
    capacity > 0
      ? Math.min((summary.confirmedChildrenOver3Labs / capacity) * 100, 100)
      : 0;

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
        <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography
              sx={{ fontSize: 12, color: "#485560", fontWeight: 700, mb: 1 }}
            >
              ISCRIZIONI
            </Typography>
            <Typography variant="h5" sx={{ color: "#2d3943" }}>
              {summary.totalRegistrations}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography
              sx={{ fontSize: 12, color: "#485560", fontWeight: 700, mb: 1 }}
            >
              BAMBINI LABORATORI
            </Typography>
            <Typography variant="h5" sx={{ color: "#2d3943" }}>
              {summary.totalChildrenOver3Labs}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography
              sx={{ fontSize: 12, color: "#485560", fontWeight: 700, mb: 1 }}
            >
              ADULTI
            </Typography>
            <Typography variant="h5" sx={{ color: "#2d3943" }}>
              {summary.totalAdults}
            </Typography>
          </CardContent>
        </Card>

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
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Data
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Nome
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Cognome
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Telefono
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Paese
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Bimbi &lt;3
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Bimbi &gt;3
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Adulti
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, color: "#2d3943", py: 1.5 }}
                      >
                        Stato
                      </TableCell>
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
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {new Date(registration.created_at).toLocaleString(
                            "it-IT",
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.first_name}
                        </TableCell>
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.last_name}
                        </TableCell>
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.phone}
                        </TableCell>
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.email}
                        </TableCell>
                        <TableCell
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.country}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.children_under_3}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.children_over_3_labs}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ py: 1.5, fontSize: 14, color: "#2d3943" }}
                        >
                          {registration.adults}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip
                            label={
                              registration.status === "confirmed"
                                ? "Confermato"
                                : "Attesa"
                            }
                            size="small"
                            color={
                              registration.status === "confirmed"
                                ? "success"
                                : "warning"
                            }
                            variant="filled"
                          />
                        </TableCell>
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
                          <Box>
                            <Typography
                              sx={{ fontWeight: 700, color: "#2d3943" }}
                            >
                              {registration.first_name} {registration.last_name}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#62707c" }}>
                              {new Date(registration.created_at).toLocaleString(
                                "it-IT",
                              )}
                            </Typography>
                          </Box>
                          <Chip
                            label={
                              registration.status === "confirmed"
                                ? "Confermato"
                                : "Attesa"
                            }
                            size="small"
                            color={
                              registration.status === "confirmed"
                                ? "success"
                                : "warning"
                            }
                          />
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
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Telefono
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.phone}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Paese
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.country}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                              gridColumn: "1 / -1",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Email
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.email}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Bimbi &lt;3
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.children_under_3}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Bimbi &gt;3
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.children_over_3_labs}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: "#f8fafc",
                              p: 1.5,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#62707c",
                                fontWeight: 600,
                              }}
                            >
                              Adulti
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#2d3943",
                                fontWeight: 500,
                              }}
                            >
                              {registration.adults}
                            </Typography>
                          </Box>
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
