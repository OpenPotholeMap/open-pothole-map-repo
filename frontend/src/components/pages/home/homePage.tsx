import { useAuth } from "@/context/authContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Shield, Car } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const reimbursementLinks = [
    {
      title: "FDOT Pothole Damage Claims",
      description: "File a claim with Florida Department of Transportation for vehicle damage caused by potholes on state roads",
      url: "https://www.fdot.gov/legal/claims/claimshomepage.shtm",
      icon: FileText,
      category: "Government"
    },
    {
      title: "FDOT Claim Form (PDF)",
      description: "Download the official claim form for pothole damage reimbursement",
      url: "https://pdl.fdot.gov/api/form/downloadAttachment/10980094",
      icon: FileText,
      category: "Forms"
    },
    {
      title: "State Farm Insurance",
      description: "Report pothole damage and file a claim with State Farm",
      url: "https://www.statefarm.com/claims/auto",
      icon: Shield,
      category: "Insurance"
    },
    {
      title: "GEICO Claims",
      description: "File a pothole damage claim with GEICO insurance",
      url: "https://claims.geico.com/ClaimsExpress/Locate",
      icon: Shield,
      category: "Insurance"
    },
    {
      title: "Progressive Claims",
      description: "Report vehicle damage from potholes to Progressive",
      url: "https://www.progressive.com/claims/",
      icon: Shield,
      category: "Insurance"
    },
    {
      title: "Allstate Claims",
      description: "File a claim for pothole damage with Allstate",
      url: "https://www.allstate.com/claims",
      icon: Shield,
      category: "Insurance"
    }
  ];

  return (
    <main className="h-screen overflow-y-auto">
      <div className="container mx-auto px-4 pt-20 pb-8">
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

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Car className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Pothole Damage Reimbursement</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Get compensated for vehicle damage caused by potholes. File claims with government agencies or your insurance provider.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reimbursementLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Card key={index} className="transition-all hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{link.title}</CardTitle>
                          <span className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                            {link.category}
                          </span>
                        </div>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                    >
                      Visit Site
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Filing Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Document the pothole with photos and location details</li>
                  <li>• Keep receipts for vehicle repairs and towing costs</li>
                  <li>• Report the pothole to local authorities promptly</li>
                  <li>• Contact your insurance company as soon as possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
