import { Lightbulb } from "lucide-react";

interface QuickSummaryBoxProps {
  excerpt: string;
}

const QuickSummaryBox = ({ excerpt }: QuickSummaryBoxProps) => {
  if (!excerpt) return null;

  return (
    <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 my-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4" /> Quick Summary
      </h2>
      <p className="text-[15px] leading-relaxed text-foreground/85">{excerpt}</p>
    </div>
  );
};

export default QuickSummaryBox;
