import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutAuthorCardProps {
  authorName?: string;
}

const AboutAuthorCard = ({ authorName = "Verified BM Shop Team" }: AboutAuthorCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-12">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary">
            {authorName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            About the Author
          </p>
          <h3 className="text-lg font-bold text-foreground">{authorName}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We are a trusted provider of verified Facebook Business Manager accounts, 
            helping advertisers scale their campaigns securely. Our team has helped 
            thousands of businesses unlock the full potential of Meta advertising.
          </p>
          <Button asChild size="sm" className="mt-4 gap-2" variant="outline">
            <a
              href="https://wa.me/message/BIAPMHQE56MHM1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4" /> Contact Us on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutAuthorCard;
