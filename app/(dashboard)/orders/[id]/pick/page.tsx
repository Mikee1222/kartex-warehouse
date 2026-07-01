import { PickFlow } from "@/components/pick/pick-flow";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PickPage({ params }: PageProps) {
  const { id } = await params;
  return <PickFlow orderId={id} />;
}
