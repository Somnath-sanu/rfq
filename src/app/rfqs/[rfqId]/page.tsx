import { RfqDetails } from "@/modules/rfqs/components/rfq-details";
import { Id } from "../../../../convex/_generated/dataModel";

export default async function Page({
  params,
}: {
  params: Promise<{ rfqId: string }>;
}) {
  const { rfqId } = await params;

  return <RfqDetails rfqId={rfqId as Id<"rfqs">} />;
}
