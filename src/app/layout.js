import "./globals.css";

export const metadata = {
  title: "Gestión de RRHH - Empresa S.A.",
  description: "Portal de gestión de recursos humanos para empleados, coordinadores y administradores.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
