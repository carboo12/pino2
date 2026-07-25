export default function NotFoundPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">La página que buscas no está disponible en esta versión.</p>
      </div>
    </div>
  );
}
