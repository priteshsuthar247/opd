import { StatusBadge } from "@/components/queue/status-badge";
import { PrescriptionBadge } from "@/components/billing/status-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { listPatientHistory } from "@/db/queries/clinical";

type History = Awaited<ReturnType<typeof listPatientHistory>>;

export function HistoryPanel({ history }: { history: History }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit history</CardTitle>
        <CardDescription>
          {history.length === 0
            ? "First visit — no prior records."
            : `${history.length} prior visit${history.length === 1 ? "" : "s"}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        {history.map((v) => (
          <div key={v.id} className="border p-2.5 text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium">
                {v.date} · {v.doctor.user.name}
              </span>
              <StatusBadge status={v.status} />
            </div>
            {v.consultation ? (
              <dl className="flex flex-col gap-1 text-muted-foreground">
                {v.consultation.chiefComplaint && (
                  <div>
                    <dt className="font-medium text-foreground">Complaint</dt>
                    <dd>{v.consultation.chiefComplaint}</dd>
                  </div>
                )}
                {v.consultation.diagnosis && (
                  <div>
                    <dt className="font-medium text-foreground">Diagnosis</dt>
                    <dd>{v.consultation.diagnosis}</dd>
                  </div>
                )}
                {v.consultation.prescription &&
                  v.consultation.prescription.items.length > 0 && (
                    <div>
                      <dt className="flex items-center gap-2 font-medium text-foreground">
                        Medicines{" "}
                        <PrescriptionBadge
                          status={v.consultation.prescription.status}
                        />
                      </dt>
                      <dd>
                        {v.consultation.prescription.items
                          .map(
                            (i) =>
                              `${i.medicine?.name ?? i.freeTextName ?? "—"} ${i.dosage} ${i.frequency} × ${i.duration}`
                          )
                          .join("; ")}
                      </dd>
                    </div>
                  )}
                {v.consultation.followUpRequired && (
                  <div>
                    <dt className="font-medium text-foreground">Follow-up</dt>
                    <dd>{v.consultation.followUpDate ?? "required"}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground">No consultation recorded.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
