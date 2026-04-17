import { Shield, Award, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.15, duration: 0.45, ease: "easeOut" as const },
  }),
};

const StatsBar = ({ stats }: { stats?: Stat[] }) => {
  const defaultStats: Stat[] = [
    { icon: <Shield className="w-6 h-6 text-primary" />, value: "100%", label: "Verified Accounts" },
    { icon: <Award className="w-6 h-6 text-primary" />, value: "A+ Rated", label: "Best Quality" },
    { icon: <Clock className="w-6 h-6 text-primary" />, value: "5+ Years", label: "On Market" },
    { icon: <Zap className="w-6 h-6 text-primary" />, value: "Instant", label: "Delivery" },
  ];

  const items = stats || defaultStats;

  return (
    <section className="border-y border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((stat, i) => (
            <motion.div
              key={i}
              className="text-center rounded-xl bg-background border border-border p-6 shadow-sm cursor-default transition-shadow hover:shadow-md hover:-translate-y-1.5 duration-300 group"
              variants={cardVariants}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex justify-center mb-2 group-hover:text-primary transition-colors duration-300 group-hover:rotate-6">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
