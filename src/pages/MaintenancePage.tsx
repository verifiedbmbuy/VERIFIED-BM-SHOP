import { Wrench } from "lucide-react";

const MaintenancePage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="max-w-md text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Wrench className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Under Maintenance</h1>
      <p className="text-muted-foreground leading-relaxed">
        We're making some improvements to serve you better. We'll be back shortly. Thank you for your patience!
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Working on it…
      </div>
    </div>
  </div>
);

export default MaintenancePage;
