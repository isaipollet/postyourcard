import OrderLayout from "@/components/OrderLayout";

export default function OrderRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrderLayout>{children}</OrderLayout>;
}
