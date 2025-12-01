import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Users, 
  Skull, 
  ChevronRight,
  PawPrint,
  Film,
  Package,
  Trophy,
  UtensilsCrossed,
  Laptop,
  Target,
  type LucideIcon
} from "lucide-react";
import { categories, type Category, type GameMode } from "@shared/schema";
import { CharacterCanvas } from "./CharacterCanvas";

const categoryIcons: Record<Category, LucideIcon> = {
  Animales: PawPrint,
  Películas: Film,
  Objetos: Package,
  Deportes: Trophy,
  Comida: UtensilsCrossed,
  Tecnología: Laptop,
  General: Target,
};

interface GameConfigProps {
  mode: GameMode;
  onBack: () => void;
  onStart: (config: {
    category: Category;
    impostorCount: number;
    playerCount?: number;
    players?: string[];
  }) => void;
}

export function GameConfig({ mode, onBack, onStart }: GameConfigProps) {
  const [step, setStep] = useState<"category" | "settings" | "players">("category");
  const [category, setCategory] = useState<Category>("General");
  const [impostorCount, setImpostorCount] = useState(1);
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [currentPlayerName, setCurrentPlayerName] = useState("");

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setStep("settings");
  };

  const handleSettingsNext = () => {
    if (mode === "classic") {
      setPlayerNames(Array(playerCount).fill(""));
      setStep("players");
    } else {
      onStart({ category, impostorCount });
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    if (playerNames.every((name) => name.trim() !== "")) {
      onStart({ category, impostorCount, playerCount, players: playerNames });
    }
  };

  const allNamesValid = playerNames.every((name) => name.trim() !== "");

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={() => {
            if (step === "category") onBack();
            else if (step === "settings") setStep("category");
            else setStep("settings");
          }}
          className="font-game gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        {step === "category" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <h2 className="text-3xl font-bold font-game text-center mb-2">
              Elige una Categoría
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Las palabras serán de esta temática
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat, index) => {
                const IconComponent = categoryIcons[cat];
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer hover-elevate transition-all duration-200 border-2 ${
                        category === cat
                          ? "border-primary bg-primary/10"
                          : "border-transparent hover:border-primary/30"
                      }`}
                      onClick={() => handleCategorySelect(cat)}
                      data-testid={`button-category-${cat.toLowerCase()}`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <IconComponent className="w-10 h-10 text-primary" />
                        <span className="font-game font-medium">{cat}</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === "settings" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              {(() => {
                const IconComponent = categoryIcons[category];
                return <IconComponent className="w-16 h-16 text-primary mx-auto mb-2" />;
              })()}
              <h2 className="text-3xl font-bold font-game">{category}</h2>
            </div>

            <Card className="p-6 space-y-6">
              <div>
                <Label className="flex items-center gap-2 text-base font-game mb-4">
                  <Skull className="w-5 h-5 text-game-impostor" />
                  Número de Impostores
                </Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImpostorCount(Math.max(1, impostorCount - 1))}
                    disabled={impostorCount <= 1}
                    data-testid="button-impostor-minus"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center justify-center w-20">
                    <CharacterCanvas role="impostor" size={50} animate={false} />
                    <span className="text-3xl font-bold font-game ml-2" data-testid="text-impostor-count">
                      {impostorCount}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImpostorCount(Math.min(5, impostorCount + 1))}
                    disabled={impostorCount >= 5 || (mode === "classic" && impostorCount >= playerCount - 2)}
                    data-testid="button-impostor-plus"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {mode === "classic" && (
                <div>
                  <Label className="flex items-center gap-2 text-base font-game mb-4">
                    <Users className="w-5 h-5 text-game-civil" />
                    Número de Jugadores
                  </Label>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newCount = Math.max(3, playerCount - 1);
                        setPlayerCount(newCount);
                        if (impostorCount >= newCount - 1) {
                          setImpostorCount(Math.max(1, newCount - 2));
                        }
                      }}
                      disabled={playerCount <= 3}
                      data-testid="button-player-minus"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(playerCount, 5) }).map((_, i) => (
                        <CharacterCanvas
                          key={i}
                          role="civil"
                          color={i % 2 === 0 ? "#3B82F6" : "#10B981"}
                          size={30}
                          animate={false}
                        />
                      ))}
                      {playerCount > 5 && (
                        <span className="text-lg font-game ml-1">+{playerCount - 5}</span>
                      )}
                    </div>
                    <span className="text-3xl font-bold font-game w-10 text-center" data-testid="text-player-count">
                      {playerCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayerCount(Math.min(10, playerCount + 1))}
                      disabled={playerCount >= 10}
                      data-testid="button-player-plus"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full font-game text-lg py-6 gap-2"
                onClick={handleSettingsNext}
                data-testid="button-continue"
              >
                {mode === "classic" ? "Introducir Nombres" : "Crear Sala"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Card>
          </motion.div>
        )}

        {step === "players" && mode === "classic" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <h2 className="text-3xl font-bold font-game text-center mb-2">
              Nombres de Jugadores
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Introduce el nombre de cada jugador
            </p>

            <Card className="p-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {playerNames.map((name, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CharacterCanvas
                      role="civil"
                      color={index % 2 === 0 ? "#3B82F6" : "#10B981"}
                      size={40}
                      animate={false}
                    />
                    <Input
                      placeholder={`Jugador ${index + 1}`}
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      className="font-game"
                      data-testid={`input-player-${index}`}
                    />
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full mt-6 font-game text-lg py-6"
                onClick={handleStartGame}
                disabled={!allNamesValid}
                data-testid="button-start-game"
              >
                Empezar Partida
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
