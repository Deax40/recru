"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body style={{ fontFamily: "monospace", padding: "2rem", background: "#0f172a", color: "#f1f5f9" }}>
        <h1 style={{ color: "#ef4444" }}>Erreur serveur</h1>
        <p><strong>Message :</strong> {error.message}</p>
        {error.digest && <p><strong>Digest :</strong> {error.digest}</p>}
        <pre style={{ background: "#1e293b", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.75rem" }}>
          {error.stack}
        </pre>
      </body>
    </html>
  );
}
