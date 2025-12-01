import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Eye, EyeOff, RotateCcw, RefreshCw, SkipForward, UserX, MessageSquare } from "lucide-react";
import { type Player } from "@shared/schema";
import { CharacterCanvas } from "./CharacterCanvas";
import { GameCard } from "./GameCard";

interface TurnViewProps {
  players: Player[];
  currentTurnIndex: number;
  currentPlayerId?: string;
  isMultiplayer?: boolean;
  isAdmin?: boolean;
  startingPlayer?: string;
  myPlayerData?: Player;
  onNextTurn: () => void;
  onRestart: () => void;
  onPlayAgain: () => void;
  onKickPlayer?: (playerId: string) => void;
  onSkipTurn?: () => void;
  onGoToClues?: () => void;
}

export function TurnView({
  players,
  currentTurnIndex,
  currentPlayerId,
  isMultiplayer = false,
  isAdmin = false,
  startingPlayer,
  myPlayerData,
  onNextTurn,
  onRestart,
  onPlayAgain,
  onKickPlayer,
  onSkipTurn,
  onGoToClues,
}: TurnViewProps) {
  const [showCard, setShowCard] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const isGameFinished = currentTurnIndex >= players.length;
  
  const currentPlayer = !isGameFinished ? players[currentTurnIndex] : null;
  const isMyTurn = isMultiplayer 
    ? currentPlayer?.id === currentPlayerId 
    : true;
  
  const displayPlayer = isMultiplayer && isMyTurn && myPlayerData 
    ? myPlayerData 
    : currentPlayer;

  useEffect(() => {
    setShowCard(false);
    setIsRevealing(false);
  }, [currentTurnIndex]);

  const handleReveal = () => {
    setIsRevealing(true);
    setTimeout(() => {
      setShowCard(true);
      setIsRevealing(false);
    }, 300);
  };

  const handleNext = () => {
    setShowCard(false);
    setTimeout(() => {
      onNextTurn();
    }, 200);
  };

  if (isGameFinished) {
    const starter = startingPlayer || players[Math.floor(Math.random() * players.length)]?.name;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center gap-2 mb-6">
            {players.slice(0, 5).map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <CharacterCanvas
                  role={player.role || "civil"}
                  color={player.color}
                  size={50}
                  animate={player.role === "impostor"}
                />
              </motion.div>
            ))}
          </div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold font-game text-foreground mb-4"
          >
            ¡Todos listos!
          </motion.h2>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/20">
              <p className="text-muted-foreground mb-2 font-game">Empieza:</p>
              <p 
                className="text-3xl font-bold font-game text-primary"
                data-testid="text-starting-player"
              >
                {starter}
              </p>
            </Card>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground mb-6"
          >
            Discutid entre vosotros y encontrad al impostor
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col gap-3"
          >
            {isMultiplayer && onGoToClues && (
              <Button
                size="lg"
                onClick={onGoToClues}
                className="font-game text-lg py-6 px-8 gap-2"
                data-testid="button-go-to-clues"
              >
                <MessageSquare className="w-5 h-5" />
                Dar Pistas y Votar
              </Button>
            )}
            <Button
              size="lg"
              onClick={onPlayAgain}
              className="font-game text-lg py-6 px-8 gap-2 bg-green-600 hover:bg-green-700"
              data-testid="button-play-again"
            >
              <RefreshCw className="w-5 h-5" />
              Volver a jugar
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onRestart}
              className="font-game text-lg py-6 px-8 gap-2"
              data-testid="button-restart"
            >
              <RotateCcw className="w-5 h-5" />
              Nueva Partida
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!isMyTurn && isMultiplayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CharacterCanvas
              role="civil"
              color={currentPlayer?.color}
              size={120}
              animate={false}
            />
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-bold font-game text-foreground mt-6 mb-2">
            Turno de:
          </h2>
          <p 
            className="text-4xl font-bold font-game text-primary"
            data-testid="text-current-turn"
          >
            {currentPlayer?.name}
          </p>

          <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0.2s" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0.4s" }} />
            </div>
            <span className="text-sm font-game">Esperando</span>
          </div>

          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-col gap-2"
            >
              <p className="text-xs text-muted-foreground mb-2">Controles de Admin</p>
              <div className="flex gap-2 justify-center">
                {onSkipTurn && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSkipTurn}
                    className="font-game gap-1"
                    data-testid="button-skip-turn"
                  >
                    <SkipForward className="w-4 h-4" />
                    Pasar turno
                  </Button>
                )}
                {onKickPlayer && currentPlayer && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onKickPlayer(currentPlayer.id)}
                    className="font-game gap-1"
                    data-testid="button-kick-player"
                  >
                    <UserX className="w-4 h-4" />
                    Expulsar
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex justify-center gap-2">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`w-3 h-3 rounded-full ${
                  index < currentTurnIndex
                    ? "bg-green-500"
                    : index === currentTurnIndex
                    ? "bg-primary animate-pulse"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm"
      >
        {!isMultiplayer && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <p className="text-muted-foreground font-game mb-1">
              Turno {currentTurnIndex + 1} de {players.length}
            </p>
            <h2 
              className="text-2xl font-bold font-game text-foreground"
              data-testid="text-player-turn"
            >
              {currentPlayer?.name}
            </h2>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!showCard ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Card className="p-8 mb-6">
                <motion.div
                  animate={isRevealing ? { rotateY: 90 } : { rotateY: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <EyeOff className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-game text-muted-foreground mb-2">
                    {isMultiplayer ? "Tu carta está oculta" : "Pasa el dispositivo a"}
                  </p>
                  {!isMultiplayer && (
                    <p className="text-xl font-bold font-game text-foreground">
                      {currentPlayer?.name}
                    </p>
                  )}
                </motion.div>
              </Card>

              <Button
                size="lg"
                onClick={handleReveal}
                className="w-full font-game text-lg py-6 gap-2"
                disabled={isRevealing}
                data-testid="button-reveal-card"
              >
                <Eye className="w-5 h-5" />
                Ver mi carta
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.3 }}
            >
              <GameCard
                role={displayPlayer?.role || "civil"}
                word={displayPlayer?.word || ""}
                playerName={displayPlayer?.name || ""}
                color={displayPlayer?.color}
              />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="w-full font-game text-lg py-6 gap-2"
                  data-testid="button-next-turn"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center gap-2"
        >
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentTurnIndex
                  ? "bg-green-500"
                  : index === currentTurnIndex
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
