import { ScanClient } from "@/app/scan/ScanClient"

export default async function ScanPage({
  searchParams
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const params = await searchParams

  return <ScanClient initialDemo={params.demo === "true"} />
}
