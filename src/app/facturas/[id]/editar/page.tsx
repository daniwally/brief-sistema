import { FacturaForm } from "@/components/facturas/factura-form";

export default async function EditarFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacturaForm facturaId={id} />;
}
