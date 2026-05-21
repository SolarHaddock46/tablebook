export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, background: "#0f172a", color: "#f8fafc", minHeight: "100vh" }}>
      <h1>TableBook API</h1>
      <p>Version: v1</p>
      <p>Status: ok</p>
      <p style={{ color: "#94a3b8", marginTop: 16 }}>
        Endpoints: <code>/api/v1/restaurants</code>, <code>/api/v1/auth/login</code>, …
      </p>
    </main>
  );
}
