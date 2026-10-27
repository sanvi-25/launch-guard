import { getSynchronizedLaunchRisks, getApod } from "@/lib/api-sync";
import { getAudits } from "./actions";
import ClientPage from "./components/ClientPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [apod, audits, launches] = await Promise.all([
    getApod(),
    getAudits(),
    getSynchronizedLaunchRisks(),
  ]);

  return <ClientPage apod={apod} launches={launches} audits={audits} />;
}
