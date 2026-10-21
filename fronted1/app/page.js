import HeroSection from "@/components/HeroesSection";
import Stats from "@/components/stats";
import ExcelFuture from "@/components/ExcelFuture";

export default function Home() {
  return (
    <main className="bg-white">
      <HeroSection />
      <Stats />
      <ExcelFuture />
    </main>
  );
}
