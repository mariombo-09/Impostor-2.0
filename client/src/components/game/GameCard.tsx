import { motion } from "framer-motion";
import { CharacterCanvas } from "./CharacterCanvas";
import { Card } from "@/components/ui/card";

interface GameCardProps {
  role: "impostor" | "civil";
  word: string;
  playerName: string;
  color?: string;
  isRevealed?: boolean;
}

export function GameCard({ 
  role, 
  word, 
  playerName, 
  color,
  isRevealed = true 
}: GameCardProps) {
  const roleLabel = role === "impostor" ? "IMPOSTOR" : "CIVIL";
  const roleColor = role === "impostor" ? "text-game-impostor" : "text-game-civil";
  const bgGradient = role === "impostor" 
    ? "from-red-500/10 to-red-600/20 dark:from-red-500/20 dark:to-red-600/30" 
    : "from-blue-500/10 to-blue-600/20 dark:from-blue-500/20 dark:to-blue-600/30";

  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: isRevealed ? 0 : 180, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{ transformStyle: "preserve-3d" }}
      className="w-full max-w-sm mx-auto"
    >
      <Card 
        className={`relative overflow-visible p-6 bg-gradient-to-br ${bgGradient} border-2 ${
          role === "impostor" ? "border-red-500/30" : "border-blue-500/30"
        }`}
        data-testid={`game-card-${role}`}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground font-game mb-1">
              {playerName}
            </p>
            <h2 
              className={`text-3xl font-bold font-game tracking-wider ${roleColor}`}
              data-testid="text-role"
            >
              {roleLabel}
            </h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <CharacterCanvas role={role} color={color} size={180} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center w-full"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-game">
              Tu palabra secreta
            </p>
            <div 
              className={`py-3 px-6 rounded-xl ${
                role === "impostor" 
                  ? "bg-red-500/20 border border-red-500/30" 
                  : "bg-blue-500/20 border border-blue-500/30"
              }`}
            >
              <span 
                className="text-2xl font-bold font-game text-foreground"
                data-testid="text-word"
              >
                {word}
              </span>
            </div>
          </motion.div>

          {role === "impostor" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-red-400 text-center font-game mt-2"
            >
              Disimula tu palabra diferente
            </motion.p>
          )}
        </div>

        <div 
          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
            role === "impostor" ? "bg-red-500" : "bg-blue-500"
          } shadow-lg`}
        >
          {role === "impostor" ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
