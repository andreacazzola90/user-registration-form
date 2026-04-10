import type { RegistrationRecord, SummaryStats } from "@/lib/types";

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

  return (
    <>
      <section
        className="card"
        style={{ padding: "1rem", marginBottom: "1rem" }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>Riepilogo</h2>
        <div
          style={{
            display: "grid",
            gap: "0.8rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          <div>
            <strong>Iscrizioni:</strong> {summary.totalRegistrations}
          </div>
          <div>
            <strong>Bambini &lt;3:</strong> {summary.totalChildrenUnder3}
          </div>
          <div>
            <strong>Bambini &gt;3 laboratori:</strong>{" "}
            {summary.totalChildrenOver3Labs}
          </div>
          <div>
            <strong>Adulti:</strong> {summary.totalAdults}
          </div>
          <div>
            <strong>Posti confermati usati:</strong>{" "}
            {summary.confirmedChildrenOver3Labs}/{capacity}
          </div>
          <div>
            <strong>Posti rimanenti:</strong> {summary.remainingSpots}
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "1rem", overflowX: "auto" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Elenco Iscritti</h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "920px",
          }}
        >
          <thead>
            <tr>
              <th>Data</th>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Telefono</th>
              <th>Email</th>
              <th>Paese</th>
              <th>Bimbi &lt;3</th>
              <th>Bimbi &gt;3 lab</th>
              <th>Adulti</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr
                key={registration.id}
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <td>
                  {new Date(registration.created_at).toLocaleString("it-IT")}
                </td>
                <td>{registration.first_name}</td>
                <td>{registration.last_name}</td>
                <td>{registration.phone}</td>
                <td>{registration.email}</td>
                <td>{registration.country}</td>
                <td>{registration.children_under_3}</td>
                <td>{registration.children_over_3_labs}</td>
                <td>{registration.adults}</td>
                <td>
                  <span className={`badge ${registration.status}`}>
                    {registration.status === "confirmed"
                      ? "Confermato"
                      : "Lista attesa"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
