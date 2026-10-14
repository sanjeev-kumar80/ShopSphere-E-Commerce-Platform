
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    { title: "Total Products", value: "—" },
    { title: "Total Orders", value: "—" },
    { title: "Customers", value: "—" },
    { title: "Revenue", value: "—" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Dashboard
      </h1>
      <p className="mt-2 text-slate-500">
        Welcome back, {user.name}. Here is your store overview.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Store management</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your dashboard is ready. Connect product, order and customer
          data as their management modules are implemented.
        </p>
      </section>
    </div>
  );
}