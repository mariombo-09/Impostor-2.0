import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check, Crown, Users, Target } from "lucide-react";
import { type Player, type Category, playerColors } from "@shared/schema";
import { CharacterCanvas } from "./CharacterCanvas";

interface LobbyProps {
  roomCode: string;
  players: Player[];
  category: Category;
  impostorCount: number;
  isAdmin: boolean;
  currentPlayerId: string;
  onBack: () => void;
  onStartGame: () => void;
}

export function Lobby({
  roomCode,
  players,
  category,
  impostorCount,
  isAdmin,
  currentPlayerId,
  onBack,
  onStartGame,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = players.length >= 3 && impostorCount < players.length;

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-blue-500/5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-4"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="font-game gap-2"
          data-testid="button-leave-lobby"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold font-game text-muted-foreground mb-2">
            Código de Sala
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span 
              className="text-5xl md:text-6xl font-bold font-mono tracking-widest text-foreground"
              data-testid="text-room-code"
            >
              {roomCode}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={copyRoomCode}
              className="shrink-0"
              data-testid="button-copy-code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Comparte este código con tus amigos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1">
            <Target className="w-6 h-6 text-primary" />
            {category}
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <CharacterCanvas role="impostor" size={24} animate={false} />
            {impostorCount} impostor{impostorCount > 1 ? "es" : ""}
          </span>
        </motion.div>

        <Card className="w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-game font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Jugadores ({players.length})
            </h3>
            {players.length < 3 && (
              <span className="text-sm text-amber-500 font-game">
                Mínimo 3 jugadores
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 ${
                  player.id === currentPlayerId ? "ring-2 ring-primary" : ""
                }`}
                data-testid={`player-card-${player.id}`}
              >
                <CharacterCanvas
                  role="civil"
                  color={player.color || playerColors[index % playerColors.length]}
                  size={36}
                  animate={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-game font-medium truncate">
                      {player.name}
                    </span>
                    {player.isAdmin && (
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {player.id === currentPlayerId && (
                    <span className="text-xs text-muted-foreground">Tú</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {players.length < 10 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex justify-center"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-dots" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-sm">Esperando jugadores</span>
              </div>
            </motion.div>
          )}
        </Card>

        {isAdmin && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <Button
              size="lg"
              className="w-full font-game text-lg py-6"
              onClick={onStartGame}
              disabled={!canStart}
              data-testid="button-start-game"
            >
              {canStart ? "Empezar Partida" : `Esperando jugadores (${players.length}/3)`}
            </Button>
          </motion.div>
        )}

        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-muted-foreground font-game"
          >
            <p>Esperando a que el administrador inicie la partida...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface JoinRoomProps {
  onBack: () => void;
  onJoin: (roomCode: string, playerName: string) => void;
  error?: string;
}

export function JoinRoom({ onBack, onJoin, error }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = () => {
    if (roomCode.trim() && playerName.trim()) {
      onJoin(roomCode.toUpperCase(), playerName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-blue-500/5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="font-game gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <CharacterCanvas role="civil" size={80} />
          <h2 className="text-3xl font-bold font-game mt-4">Unirse a Sala</h2>
        </motion.div>

        <Card className="w-full p-6 space-y-6">
          <div>
            <Label className="font-game mb-2 block">Código de Sala</Label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="text-center text-2xl font-mono tracking-widest uppercase"
              maxLength={4}
              data-testid="input-room-code"
            />
          </div>

          <div>
            <Label className="font-game mb-2 block">Tu Nombre</Label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Introduce tu nombre"
              className="font-game"
              maxLength={20}
              data-testid="input-player-name"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          <Button
            size="lg"
            className="w-full font-game text-lg py-6"
            onClick={handleJoin}
            disabled={!roomCode.trim() || !playerName.trim()}
            data-testid="button-join-room"
          >
            Unirse
          </Button>
        </Card>
      </div>
    </div>
  );
}

interface CreateRoomProps {
  onBack: () => void;
  onCreate: (playerName: string) => void;
}

export function CreateRoom({ onBack, onCreate }: CreateRoomProps) {
  const [playerName, setPlayerName] = useState("");

  const handleCreate = () => {
    if (playerName.trim()) {
      onCreate(playerName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="font-game gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <CharacterCanvas role="impostor" size={80} />
          <h2 className="text-3xl font-bold font-game mt-4">Crear Sala</h2>
        </motion.div>

        <Card className="w-full p-6 space-y-6">
          <div>
            <Label className="font-game mb-2 block">Tu Nombre</Label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Introduce tu nombre"
              className="font-game"
              maxLength={20}
              data-testid="input-player-name"
            />
          </div>

          <Button
            size="lg"
            className="w-full font-game text-lg py-6"
            onClick={handleCreate}
            disabled={!playerName.trim()}
            data-testid="button-create-room"
          >
            Crear Sala
          </Button>
        </Card>
      </div>
    </div>
  );
}

interface MultiplayerMenuProps {
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MultiplayerMenu({ onBack, onCreateRoom, onJoinRoom }: MultiplayerMenuProps) {
  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-blue-500/5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="font-game gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="flex justify-center gap-2 mb-4">
            <CharacterCanvas role="civil" size={60} animate={false} />
            <CharacterCanvas role="impostor" size={70} />
            <CharacterCanvas role="civil" color="#10B981" size={60} animate={false} />
          </div>
          <h2 className="text-3xl font-bold font-game">Multijugador</h2>
          <p className="text-muted-foreground mt-2">
            Juega online con tus amigos
          </p>
        </motion.div>

        <div className="w-full space-y-4">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="p-6 cursor-pointer hover-elevate transition-all border-2 border-transparent hover:border-primary/30"
              onClick={onCreateRoom}
              data-testid="button-create-room"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-game font-semibold text-lg">Crear Sala</h3>
                  <p className="text-sm text-muted-foreground">
                    Sé el administrador de la partida
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="p-6 cursor-pointer hover-elevate transition-all border-2 border-transparent hover:border-blue-500/30"
              onClick={onJoinRoom}
              data-testid="button-join-room"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-game font-semibold text-lg">Unirse a Sala</h3>
                  <p className="text-sm text-muted-foreground">
                    Introduce un código de sala
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
