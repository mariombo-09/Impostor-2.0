import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Wifi } from "lucide-react";
import { CharacterCanvas } from "./CharacterCanvas";

interface ModeSelectionProps {
  onSelectMode: (mode: "classic" | "multiplayer") => void;
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <div className="flex justify-center gap-4 mb-4">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CharacterCanvas role="civil" size={80} animate={false} />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <CharacterCanvas role="impostor" size={100} animate={true} />
          </motion.div>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CharacterCanvas role="civil" color="#10B981" size={80} animate={false} />
          </motion.div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold font-game text-foreground tracking-tight mb-2">
          IMPOSTOR
        </h1>
        <p className="text-lg text-muted-foreground font-game">
          El juego de cartas multijugador
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card 
            className="p-6 hover-elevate cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-primary/30"
            onClick={() => onSelectMode("classic")}
            data-testid="button-mode-classic"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-game text-foreground mb-2">
                  Clásico
                </h2>
                <p className="text-sm text-muted-foreground">
                  Juega en un solo dispositivo con tus amigos. 
                  Perfecto para partidas locales.
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full font-game text-lg py-6"
              >
                Jugar Local
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card 
            className="p-6 hover-elevate cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-blue-500/30"
            onClick={() => onSelectMode("multiplayer")}
            data-testid="button-mode-multiplayer"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Wifi className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-game text-foreground mb-2">
                  Multijugador
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cada jugador usa su propio dispositivo.
                  Crea o únete a una sala online.
                </p>
              </div>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full font-game text-lg py-6 border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
              >
                Jugar Online
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-sm text-muted-foreground text-center max-w-md"
      >
        Descubre al impostor entre tus amigos. Cada jugador recibe una palabra 
        secreta relacionada, pero el impostor tiene una diferente.
      </motion.p>
    </div>
  );
}
