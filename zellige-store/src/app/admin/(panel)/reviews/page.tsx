import Link from "next/link";
import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { moderateReview } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, Badge } from "@/components/admin/ui";
import { Stars } from "@/components/ui/Stars";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "PENDING" } = await searchParams;
  const st = (["PENDING", "APPROVED", "REJECTED"].includes(status) ? status : "PENDING") as ReviewStatus;
  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({ where: { status: st }, orderBy: { createdAt: "desc" }, take: 200, include: { product: { select: { id: true, name: true } } } }),
    prisma.review.groupBy({ by: ["status"], _count: true }),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <>
      <PageHeader title="Reviews" description="Reviews appear on the store only after approval. Approve honest negative reviews too." />
      <div className="mb-4 flex gap-2 text-sm">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => <Link key={s} href={`/admin/reviews?status=${s}`} className={`chip ${st === s ? "chip-active" : "bg-white"}`}>{s.toLowerCase()} ({n(s)})</Link>)}
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Stars value={r.rating} />
              <span className="font-semibold">{r.name}</span>
              {r.email && <span className="text-charcoal-500">{r.email}</span>}
              {r.verifiedPurchase && <Badge tone="green">verified purchase</Badge>}
              <span className="text-charcoal-400">{r.createdAt.toLocaleDateString("fr-MA")} · {r.locale.toUpperCase()}</span>
              <Link href={`/admin/products/${r.product.id}`} className="ms-auto text-majorelle hover:underline">{tr(r.product.name, "fr")}</Link>
            </div>
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-sm text-charcoal-600" dir="auto">{r.body}</p>
            <div className="mt-3 flex gap-2">
              {st !== "APPROVED" && <ActionButton action={moderateReview} fields={{ id: r.id, op: "approve" }} variant="primary">Approve</ActionButton>}
              {st !== "REJECTED" && <ActionButton action={moderateReview} fields={{ id: r.id, op: "reject" }}>Reject</ActionButton>}
              <ActionButton action={moderateReview} fields={{ id: r.id, op: "delete" }} variant="danger" confirm="Delete this review?">Delete</ActionButton>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-charcoal-500">Nothing here.</p>}
      </div>
    </>
  );
}
