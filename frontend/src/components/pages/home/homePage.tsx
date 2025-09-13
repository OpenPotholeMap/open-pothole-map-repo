import { Navbar } from "@/components/ui/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center">Welcome to OpenPotholeMap</h1>
        <p className="text-center text-muted-foreground mt-4">
          Report and track potholes in your community
        </p>
      </main>
    </div>
  )
}
