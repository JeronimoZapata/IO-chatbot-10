import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1>ChatBot de Modelos de Simulacion</h1>
      <p>Frontend inicial listo para continuar en la siguiente etapa.</p>
      <p>
        <Link href="/chat">Ir al chat</Link>
      </p>
    </main>
  );
}
