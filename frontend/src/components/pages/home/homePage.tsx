import { useAuth } from "@/context/authContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="container mx-auto px-4 pt-20">
      <h1 className="text-4xl font-bold text-center">
        Welcome to OpenPotholeMap
      </h1>
      <p className="text-center text-muted-foreground mt-4">
        Report and track potholes in your community
      </p>

      {user && (
        <div className="mt-8 text-center">
          <p className="text-lg text-muted-foreground">
            Welcome back! Navigate to the Map to start detecting potholes.
          </p>
        </div>
      )}
    </main>
  );
}
