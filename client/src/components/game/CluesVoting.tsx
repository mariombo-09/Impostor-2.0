import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Vote as VoteIcon, RefreshCw, RotateCcw, Check, Trophy, Skull, UserX } from "lucide-react";
import { type Player, type ClueEntry, type Vote } from "@shared/schema";
import { CharacterCanvas } from "./CharacterCanvas";

interface GameResult {
  impostorCaught: boolean;
  eliminatedPlayer?: Player;
  startingPlayer?: string;
  gameOver: boolean;
  impostorWinsDirectly?: boolean;
}

interface CluesVotingProps {
  phase: "clues" | "voting" | "results";
  players: Player[];
  currentPlayerId: string;
  clues: ClueEntry[];
  votes: Vote[];
  hasVoted: boolean;
  isAdmin: boolean;
  eliminatedPlayerIds?: string[];
  roundNumber?: number;
  onSubmitClue: (clue: string) => void;
  onSubmitVote: (votedForId: string) => void;
  onStartVoting: () => void;
  onPlayAgain: () => void;
  onRestart: () => void;
  onContinueNextRound?: (eliminatedPlayerId: string, startingPlayer: string) => void;
}

export function CluesVoting({
  phase,
  players,
  currentPlayerId,
  clues,
  votes,
  hasVoted,
  isAdmin,
  eliminatedPlayerIds = [],
  roundNumber = 1,
  onSubmitClue,
  onSubmitVote,
  onStartVoting,
  onPlayAgain,
  onRestart,
  onContinueNextRound,
}: CluesVotingProps) {
  const [clueInput, setClueInput] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const activePlayers = useMemo(() => 
    players.filter(p => !eliminatedPlayerIds.includes(p.id)),
    [players, eliminatedPlayerIds]
  );

  const gameResult = useMemo((): GameResult | null => {
    if (phase !== "results" || votes.length === 0) return null;

    const voteCounts: Record<string, number> = {};
    votes.forEach(v => {
      voteCounts[v.votedForId] = (voteCounts[v.votedForId] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts));
    const mostVotedIds = Object.entries(voteCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([id]) => id);

    const mostVotedId = mostVotedIds[0];
    const mostVotedPlayer = activePlayers.find(p => p.id === mostVotedId);
    
    if (!mostVotedPlayer) return null;

    const isImpostor = mostVotedPlayer.role === "impostor";
    const remainingPlayersAfterElimination = activePlayers.filter(p => p.id !== mostVotedId);
    const impostorsRemaining = remainingPlayersAfterElimination.filter(p => p.role === "impostor");
    const civilsRemaining = remainingPlayersAfterElimination.filter(p => p.role === "civil");

    if (isImpostor) {
      return {
        impostorCaught: true,
        eliminatedPlayer: mostVotedPlayer,
        startingPlayer: activePlayers[Math.floor(Math.random() * activePlayers.length)]?.name,
        gameOver: true,
      };
    }

    if (remainingPlayersAfterElimination.length <= 2 && impostorsRemaining.length > 0) {
      return {
        impostorCaught: false,
        eliminatedPlayer: mostVotedPlayer,
        gameOver: true,
        impostorWinsDirectly: true,
        startingPlayer: undefined,
      };
    }

    if (civilsRemaining.length <= impostorsRemaining.length) {
      return {
        impostorCaught: false,
        eliminatedPlayer: mostVotedPlayer,
        gameOver: true,
        impostorWinsDirectly: true,
        startingPlayer: undefined,
      };
    }

    const eligibleStarters = remainingPlayersAfterElimination.filter(p => p.id !== mostVotedId);
    const randomStarter = eligibleStarters[Math.floor(Math.random() * eligibleStarters.length)];

    return {
      impostorCaught: false,
      eliminatedPlayer: mostVotedPlayer,
      startingPlayer: randomStarter?.name,
      gameOver: false,
    };
  }, [phase, votes, activePlayers]);

  useEffect(() => {
    if (phase === "voting") {
      setIsSubmittingVote(false);
      setSelectedVote(null);
      setShowEndAnimation(false);
      setAnimationStep(0);
    }
  }, [phase]);

  useEffect(() => {
    if (hasVoted) {
      setIsSubmittingVote(false);
    }
  }, [hasVoted]);

  useEffect(() => {
    if (phase === "results" && votes.length > 0) {
      setShowEndAnimation(true);
      setAnimationStep(0);
      
      // Step 0: "Contando votos..." - 1 second
      // Step 1: Show who voted for whom + eliminated player - 5 seconds
      // Step 2: "¡Era/No era el impostor!" - 2 seconds
      // Step 3: Final results screen
      const timer1 = setTimeout(() => setAnimationStep(1), 1000);
      const timer2 = setTimeout(() => setAnimationStep(2), 6000);
      const timer3 = setTimeout(() => setAnimationStep(3), 8000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [phase, votes.length]);

  const effectiveHasVoted = hasVoted || isSubmittingVote;
  const hasSubmittedClue = clues.some(c => c.playerId === currentPlayerId);
  const allCluesSubmitted = clues.length === activePlayers.length;

  const handleSubmitClue = () => {
    if (clueInput.trim()) {
      onSubmitClue(clueInput.trim());
      setClueInput("");
    }
  };

  const handleVote = () => {
    if (selectedVote && !isSubmittingVote) {
      setIsSubmittingVote(true);
      onSubmitVote(selectedVote);
    }
  };

  const getVotesForPlayer = (playerId: string) => {
    return votes.filter(v => v.votedForId === playerId);
  };

  const handleContinueNextRound = () => {
    if (gameResult?.eliminatedPlayer && gameResult.startingPlayer && onContinueNextRound) {
      onContinueNextRound(gameResult.eliminatedPlayer.id, gameResult.startingPlayer);
    }
  };

  if (phase === "clues") {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold font-game text-center mb-4"
          >
            Ronda de Pistas {roundNumber > 1 && `#${roundNumber}`}
          </motion.h2>

          {eliminatedPlayerIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4"
            >
              <Card className="p-3 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <UserX className="w-4 h-4" />
                  <span className="text-sm font-game">
                    {eliminatedPlayerIds.length} jugador{eliminatedPlayerIds.length > 1 ? 'es' : ''} eliminado{eliminatedPlayerIds.length > 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-center text-sm mb-6"
          >
            Escribe una pista sobre tu palabra sin decirla directamente
          </motion.p>

          {!hasSubmittedClue ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6"
            >
              <Card className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    placeholder="Tu pista..."
                    className="font-game"
                    maxLength={50}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
                    data-testid="input-clue"
                  />
                  <Button
                    onClick={handleSubmitClue}
                    disabled={!clueInput.trim()}
                    data-testid="button-submit-clue"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6"
            >
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-game">Pista enviada</span>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-game text-muted-foreground mb-3">
              Pistas enviadas ({clues.length}/{activePlayers.length})
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {clues.map((clue, index) => (
                  <motion.div
                    key={clue.playerId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3">
                      <div className="flex items-center gap-3">
                        <CharacterCanvas
                          role="civil"
                          color={activePlayers.find(p => p.id === clue.playerId)?.color}
                          size={32}
                          animate={false}
                        />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">{clue.playerName}</p>
                          <p className="font-game text-lg">{clue.clue}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {allCluesSubmitted && isAdmin && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-6"
            >
              <Button
                size="lg"
                className="w-full font-game text-lg py-6 gap-2"
                onClick={onStartVoting}
                data-testid="button-start-voting"
              >
                <VoteIcon className="w-5 h-5" />
                Iniciar Votacion
              </Button>
            </motion.div>
          )}

          {allCluesSubmitted && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center text-muted-foreground"
            >
              <p className="font-game">Esperando al admin para iniciar votacion...</p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "voting") {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold font-game text-center mb-4"
          >
            Votacion
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-center text-sm mb-6"
          >
            Selecciona quien crees que es el impostor
          </motion.p>

          {!effectiveHasVoted ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {activePlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        selectedVote === player.id
                          ? "ring-2 ring-primary bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedVote(player.id)}
                      data-testid={`vote-player-${player.id}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CharacterCanvas
                          role="civil"
                          color={player.color}
                          size={48}
                          animate={false}
                        />
                        <p className="font-game text-sm text-center">{player.name}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full font-game text-lg py-6 gap-2"
                onClick={handleVote}
                disabled={!selectedVote || isSubmittingVote}
                data-testid="button-submit-vote"
              >
                <VoteIcon className="w-5 h-5" />
                {isSubmittingVote ? "Enviando..." : "Votar"}
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <Card className="p-6 bg-green-500/10 border-green-500/30">
                <div className="flex flex-col items-center gap-2 text-green-600">
                  <Check className="w-8 h-8" />
                  <span className="font-game text-lg">Voto enviado</span>
                  <p className="text-sm text-muted-foreground">
                    Esperando a los demas jugadores...
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "results" && gameResult) {
    const { impostorCaught, eliminatedPlayer, startingPlayer, gameOver, impostorWinsDirectly } = gameResult;
    const impostor = players.find(p => p.role === "impostor");

    if (showEndAnimation && animationStep < 3 && eliminatedPlayer) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
          <AnimatePresence mode="wait">
            {animationStep === 0 && (
              <motion.div
                key="step0"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <VoteIcon className="w-20 h-20 text-primary mx-auto mb-4" />
                </motion.div>
                <p className="text-xl font-game text-muted-foreground">Contando votos...</p>
              </motion.div>
            )}

            {animationStep === 1 && (
              <motion.div
                key="step1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="text-center w-full max-w-md"
              >
                <div className="flex flex-col items-center mb-6">
                  <CharacterCanvas
                    role={eliminatedPlayer.role || "civil"}
                    color={eliminatedPlayer.color}
                    size={100}
                    animate={true}
                  />
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold font-game mt-3"
                  >
                    {eliminatedPlayer.name}
                  </motion.p>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-muted-foreground font-game"
                  >
                    ha sido eliminado
                  </motion.p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-card/50 rounded-lg p-4 border"
                >
                  <p className="text-sm font-semibold text-muted-foreground mb-3 font-game">Resultados de la votación:</p>
                  <div className="space-y-2">
                    {votes.map((vote, idx) => {
                      const votedFor = players.find(p => p.id === vote.votedForId);
                      return (
                        <motion.div
                          key={vote.voterId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + idx * 0.15 }}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-game">{vote.voterName}</span>
                          <span className="text-muted-foreground mx-2">votó a</span>
                          <span className={`font-bold font-game ${votedFor?.id === eliminatedPlayer.id ? 'text-red-500' : ''}`}>
                            {votedFor?.name || 'Desconocido'}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {animationStep === 2 && (
              <motion.div
                key="step2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-center"
              >
                {impostorCaught ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-3xl font-bold font-game text-green-500">
                      ¡Era el impostor!
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    >
                      <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-3xl font-bold font-game text-red-500">
                      ¡No era el impostor!
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center w-full"
          >
            {gameOver ? (
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-6"
                >
                  {impostorCaught ? (
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
                  ) : (
                    <Skull className="w-20 h-20 text-red-500 mx-auto" />
                  )}
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`text-4xl font-bold font-game mb-4 ${
                    impostorCaught ? "text-green-500" : "text-red-500"
                  }`}
                  data-testid="text-game-result"
                >
                  {impostorCaught ? "¡Habeis ganado!" : "¡Habeis perdido!"}
                </motion.h2>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  {impostor && (
                    <Card className="p-4 ring-2 ring-red-500 bg-red-500/10 mb-4">
                      <div className="flex items-center justify-center gap-3">
                        <CharacterCanvas
                          role="impostor"
                          color={impostor.color}
                          size={60}
                          animate={true}
                        />
                        <div className="text-left">
                          <p className="font-game text-lg">{impostor.name}</p>
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-game">
                            IMPOSTOR
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            Palabra: <span className="font-medium">{impostor.word}</span>
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {impostorWinsDirectly && (
                    <p className="text-muted-foreground font-game text-sm mb-4">
                      Solo quedaban 2 jugadores. ¡El impostor gana automaticamente!
                    </p>
                  )}
                </motion.div>

                {startingPlayer && (
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
                        {startingPlayer}
                      </p>
                    </Card>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-3"
                >
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
              </>
            ) : (
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-6"
                >
                  <UserX className="w-20 h-20 text-orange-500 mx-auto" />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold font-game mb-2 text-orange-500"
                >
                  ¡Habeis fallado!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground font-game mb-6"
                >
                  {eliminatedPlayer?.name} no era el impostor
                </motion.p>

                {eliminatedPlayer && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                  >
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center justify-center gap-3">
                        <CharacterCanvas
                          role="civil"
                          color={eliminatedPlayer.color}
                          size={50}
                          animate={false}
                        />
                        <div className="text-left">
                          <p className="font-game">{eliminatedPlayer.name}</p>
                          <p className="text-xs text-muted-foreground">Eliminado</p>
                          <p className="text-sm text-muted-foreground">
                            Palabra: <span className="font-medium">{eliminatedPlayer.word}</span>
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {startingPlayer && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/20">
                      <p className="text-muted-foreground mb-2 font-game">Siguiente ronda - Empieza:</p>
                      <p 
                        className="text-3xl font-bold font-game text-primary"
                        data-testid="text-starting-player"
                      >
                        {startingPlayer}
                      </p>
                    </Card>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-3"
                >
                  {onContinueNextRound && (
                    <Button
                      size="lg"
                      onClick={handleContinueNextRound}
                      className="font-game text-lg py-6 px-8 gap-2"
                      data-testid="button-continue-round"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Continuar Ronda
                    </Button>
                  )}
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
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold font-game text-center mb-6"
          >
            Resultados
          </motion.h2>

          <div className="space-y-4 mb-6">
            {activePlayers.map((player, index) => {
              const playerVotes = getVotesForPlayer(player.id);
              
              return (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CharacterCanvas
                        role="civil"
                        color={player.color}
                        size={48}
                        animate={false}
                      />
                      <div className="flex-1">
                        <p className="font-game text-lg">{player.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-game text-primary">
                          {playerVotes.length}
                        </p>
                        <p className="text-xs text-muted-foreground">votos</p>
                      </div>
                    </div>
                    
                    {playerVotes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted">
                        <p className="text-xs text-muted-foreground mb-1">Votado por:</p>
                        <div className="flex flex-wrap gap-1">
                          {playerVotes.map(v => (
                            <span
                              key={v.voterId}
                              className="text-xs bg-muted px-2 py-0.5 rounded-full"
                            >
                              {v.voterName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3"
          >
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
        </div>
      </div>
    );
  }

  return null;
}
