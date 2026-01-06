import { ThemeProvider } from "./components/theme-provider";
import ProjectileSimulation from "./components/projectile-simulation";

export default function App() {
  return (
    <ThemeProvider>
      <ProjectileSimulation />
    </ThemeProvider>
  );
}
