export default function AdminDashboardPage() {
  const stats = [
    { label: "Productos", value: "—" },
    { label: "Categorías", value: "—" },
    { label: "Marcas", value: "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Panel administrativo. Conecta Supabase para métricas en tiempo real.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 p-6"
          >
            <dt className="text-sm text-zinc-500">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
