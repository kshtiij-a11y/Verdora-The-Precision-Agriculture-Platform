
import { HeroSection } from "@/components/HeroSection";
import { LandingPage } from "@/components/LandingPage";
import './landing.css';

export default function Home() {
  return (
    <div 
      className="w-full bg-no-repeat bg-cover bg-center"
      style={{backgroundImage: "url('https://picsum.photos/seed/green-field/1920/1080')"}}
      data-ai-hint="green field"
    >
      <div className="bg-black/60 backdrop-blur-sm">
        {/* Removed the container from here to let child components manage their own layout */}
        <HeroSection />
        <LandingPage />
      </div>
    </div>
  );
}
