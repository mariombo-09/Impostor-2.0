import { useState, useEffect, useCallback, useRef } from "react";
import { 
  type GameMode, 
  type Category, 
  type Player, 
  type GameState,
  type ClueEntry,
  type Vote,
  categoryWords,
  playerColors,
} from "@shared/schema";
import { ModeSelection } from "@/components/game/ModeSelection";
import { GameConfig } from "@/components/game/GameConfig";
import { 
  Lobby, 
  JoinRoom, 
  CreateRoom, 
  MultiplayerMenu 
} from "@/components/game/Lobby";
import { TurnView } from "@/components/game/TurnView";
import { CluesVoting } from "@/components/game/CluesVoting";

type GameScreen = 
  | "mode" 
  | "config" 
  | "multiplayer-menu"
  | "create-room"
  | "join-room"
  | "lobby"
  | "playing"
  | "clues"
  | "voting"
  | "results";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function assignRolesAndWords(
  players: Player[],
  category: Category,
  impostorCount: number
): Player[] {
  const wordPairs = categoryWords[category];
  const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  
  const effectiveImpostorCount = Math.min(impostorCount, shuffledPlayers.length - 1);
  
  const impostorIndices = new Set<number>();
  while (impostorIndices.size < effectiveImpostorCount) {
    impostorIndices.add(Math.floor(Math.random() * shuffledPlayers.length));
  }
  
  const civilWord = randomPair.palabra;
  const impostorHint = randomPair.pista;
  
  return shuffledPlayers.map((player, index) => {
    const isImpostor = impostorIndices.has(index);
    return {
      ...player,
      role: isImpostor ? "impostor" as const : "civil" as const,
      word: isImpostor ? impostorHint : civilWord,
    };
  });
}

export default function Game() {
  const [screen, setScreen] = useState<GameScreen>("mode");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [wsError, setWsError] = useState<string>("");
  
  const socketRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsError("Error de conexión");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return socket;
  }, []);

  const handleWebSocketMessage = (message: { type: string; payload: unknown }) => {
    switch (message.type) {
      case "roomState": {
        const payload = message.payload as {
          roomCode: string;
          players: Player[];
          category: Category;
          impostorCount: number;
          isAdmin: boolean;
          playerId: string;
        };
        setCurrentPlayerId(payload.playerId);
        setGameState({
          mode: "multiplayer",
          category: payload.category,
          impostorCount: payload.impostorCount,
          players: payload.players,
          currentTurnIndex: 0,
          gamePhase: "setup",
          roomCode: payload.roomCode,
        });
        setScreen("lobby");
        break;
      }
      case "playerJoined": {
        const payload = message.payload as { players: Player[] };
        setGameState((prev) => prev ? { ...prev, players: payload.players } : null);
        break;
      }
      case "playerLeft": {
        const payload = message.payload as { players: Player[] };
        setGameState((prev) => prev ? { ...prev, players: payload.players } : null);
        break;
      }
      case "gameStarted": {
        const payload = message.payload as {
          player: Player;
          currentTurnIndex: number;
          totalPlayers: number;
          startingPlayer: string;
          publicPlayers: { id: string; name: string; color: string; isHost?: boolean }[];
        };
        const playersWithMyData = payload.publicPlayers.map(p => {
          if (p.id === payload.player.id) {
            return payload.player;
          }
          return { ...p, role: undefined, word: undefined } as Player;
        });
        setGameState((prev) => prev ? {
          ...prev,
          players: playersWithMyData,
          currentTurnIndex: payload.currentTurnIndex,
          gamePhase: "playing",
          startingPlayer: payload.startingPlayer,
          myPlayerData: payload.player,
        } : null);
        setScreen("playing");
        break;
      }
      case "turnUpdate": {
        const payload = message.payload as { currentTurnIndex: number };
        setGameState((prev) => prev ? { 
          ...prev, 
          currentTurnIndex: payload.currentTurnIndex 
        } : null);
        break;
      }
      case "error": {
        const payload = message.payload as { message: string };
        setWsError(payload.message);
        break;
      }
      case "kicked": {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        setGameState(null);
        setScreen("mode");
        setWsError("Has sido expulsado de la sala");
        break;
      }
      case "playerKicked": {
        const payload = message.payload as { 
          players: Player[]; 
          currentTurnIndex: number;
        };
        setGameState((prev) => prev ? { 
          ...prev, 
          players: payload.players,
          currentTurnIndex: payload.currentTurnIndex,
        } : null);
        break;
      }
      case "cluesStarted": {
        const payload = message.payload as {
          gamePhase: string;
          clues: ClueEntry[];
          votes: Vote[];
        };
        setGameState((prev) => prev ? {
          ...prev,
          gamePhase: "clues" as const,
          clues: payload.clues,
          votes: payload.votes,
          hasVoted: false,
        } : null);
        setScreen("clues");
        break;
      }
      case "clueSubmitted": {
        const payload = message.payload as {
          clues: ClueEntry[];
          allSubmitted: boolean;
        };
        setGameState((prev) => prev ? {
          ...prev,
          clues: payload.clues,
        } : null);
        break;
      }
      case "votingStarted": {
        const payload = message.payload as {
          gamePhase: string;
          players: Player[];
          votes: Vote[];
          clues: ClueEntry[];
        };
        setGameState((prev) => prev ? {
          ...prev,
          gamePhase: "voting" as const,
          votes: payload.votes,
          clues: payload.clues,
          hasVoted: false,
        } : null);
        setScreen("voting");
        break;
      }
      case "voteSubmitted": {
        const payload = message.payload as {
          votesCount: number;
          totalPlayers: number;
          votedPlayerIds: string[];
          votes: Vote[];
        };
        setGameState((prev) => {
          if (!prev) return null;
          const myId = prev.myPlayerData?.id || currentPlayerId;
          const iHaveVoted = payload.votedPlayerIds.includes(myId);
          return {
            ...prev,
            votesCount: payload.votesCount,
            votedPlayerIds: payload.votedPlayerIds,
            votes: payload.votes,
            hasVoted: iHaveVoted,
          };
        });
        break;
      }
      case "votingResults": {
        const payload = message.payload as {
          gamePhase: string;
          votes: Vote[];
          players: Player[];
        };
        setGameState((prev) => prev ? {
          ...prev,
          gamePhase: "results" as const,
          votes: payload.votes,
          players: payload.players,
        } : null);
        setScreen("results");
        break;
      }
    }
  };

  const sendWebSocketMessage = (type: string, payload: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    if (mode === "classic") {
      setScreen("config");
    } else {
      setScreen("multiplayer-menu");
    }
    setGameState({
      mode,
      category: "General",
      impostorCount: 1,
      players: [],
      currentTurnIndex: 0,
      gamePhase: "setup",
    });
  };

  const handleClassicStart = (config: {
    category: Category;
    impostorCount: number;
    playerCount?: number;
    players?: string[];
  }) => {
    if (!config.players) return;

    const players: Player[] = config.players.map((name, index) => ({
      id: generatePlayerId(),
      name,
      color: playerColors[index % playerColors.length],
    }));

    const assignedPlayers = assignRolesAndWords(
      players,
      config.category,
      config.impostorCount
    );

    const startingPlayer = assignedPlayers[
      Math.floor(Math.random() * assignedPlayers.length)
    ].name;

    setGameState({
      mode: "classic",
      category: config.category,
      impostorCount: config.impostorCount,
      players: assignedPlayers,
      currentTurnIndex: 0,
      gamePhase: "playing",
      startingPlayer,
    });
    setScreen("playing");
  };

  const handleMultiplayerConfig = (config: {
    category: Category;
    impostorCount: number;
  }) => {
    setGameState((prev) => prev ? {
      ...prev,
      category: config.category,
      impostorCount: config.impostorCount,
    } : null);
    setScreen("create-room");
  };

  const handleCreateRoom = (playerName: string) => {
    const socket = connectWebSocket();
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();
    
    setCurrentPlayerId(playerId);
    
    socket.onopen = () => {
      sendWebSocketMessage("createRoom", {
        roomCode,
        playerName,
        playerId,
        category: gameState?.category || "General",
        impostorCount: gameState?.impostorCount || 1,
      });
    };
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    setWsError("");
    const socket = connectWebSocket();
    const playerId = generatePlayerId();
    
    setCurrentPlayerId(playerId);
    
    socket.onopen = () => {
      sendWebSocketMessage("joinRoom", {
        roomCode,
        playerName,
        playerId,
      });
    };
  };

  const handleStartMultiplayerGame = () => {
    sendWebSocketMessage("startGame", {
      roomCode: gameState?.roomCode,
    });
  };

  const handleNextTurn = () => {
    if (gameState?.mode === "classic") {
      setGameState((prev) => prev ? {
        ...prev,
        currentTurnIndex: prev.currentTurnIndex + 1,
      } : null);
    } else {
      sendWebSocketMessage("nextTurn", {
        roomCode: gameState?.roomCode,
      });
    }
  };

  const handleRestart = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setGameState(null);
    setScreen("mode");
    setWsError("");
  };

  const handlePlayAgain = () => {
    if (!gameState) return;

    if (gameState.mode === "classic") {
      const playersWithoutRoles = gameState.players.map(p => ({
        ...p,
        role: undefined,
        word: undefined,
      }));
      
      const assignedPlayers = assignRolesAndWords(
        playersWithoutRoles,
        gameState.category,
        gameState.impostorCount
      );

      const startingPlayer = assignedPlayers[
        Math.floor(Math.random() * assignedPlayers.length)
      ].name;

      setGameState({
        ...gameState,
        players: assignedPlayers,
        currentTurnIndex: 0,
        gamePhase: "playing",
        startingPlayer,
      });
    } else {
      sendWebSocketMessage("playAgain", {
        roomCode: gameState.roomCode,
      });
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("kickPlayer", {
        roomCode: gameState.roomCode,
        playerId,
      });
    }
  };

  const handleSkipTurn = () => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("skipTurn", {
        roomCode: gameState.roomCode,
      });
    }
  };

  const handleSubmitClue = (clue: string) => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("submitClue", {
        roomCode: gameState.roomCode,
        clue,
      });
    }
  };

  const handleStartVoting = () => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("startVoting", {
        roomCode: gameState.roomCode,
      });
    }
  };

  const handleSubmitVote = (votedForId: string) => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("submitVote", {
        roomCode: gameState.roomCode,
        votedForId,
      });
      setGameState(prev => prev ? { ...prev, hasVoted: true } : null);
    }
  };

  const handleGoToClues = () => {
    if (gameState?.mode === "multiplayer") {
      sendWebSocketMessage("startClues", {
        roomCode: gameState.roomCode,
      });
    }
  };

  const handleBack = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    switch (screen) {
      case "config":
        setScreen("mode");
        break;
      case "multiplayer-menu":
        setScreen("mode");
        break;
      case "create-room":
        setScreen("config");
        break;
      case "join-room":
        setScreen("multiplayer-menu");
        break;
      case "lobby":
        setScreen("multiplayer-menu");
        break;
      default:
        setScreen("mode");
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const currentPlayer = gameState?.players.find((p) => p.id === currentPlayerId);
  const isAdmin = currentPlayer?.isAdmin || false;

  return (
    <div className="min-h-screen bg-background">
      {screen === "mode" && (
        <ModeSelection onSelectMode={handleModeSelect} />
      )}

      {screen === "config" && gameState && (
        <GameConfig
          mode={gameState.mode}
          onBack={handleBack}
          onStart={gameState.mode === "classic" ? handleClassicStart : handleMultiplayerConfig}
        />
      )}

      {screen === "multiplayer-menu" && (
        <MultiplayerMenu
          onBack={handleBack}
          onCreateRoom={() => setScreen("config")}
          onJoinRoom={() => setScreen("join-room")}
        />
      )}

      {screen === "create-room" && (
        <CreateRoom
          onBack={handleBack}
          onCreate={handleCreateRoom}
        />
      )}

      {screen === "join-room" && (
        <JoinRoom
          onBack={handleBack}
          onJoin={handleJoinRoom}
          error={wsError}
        />
      )}

      {screen === "lobby" && gameState && (
        <Lobby
          roomCode={gameState.roomCode || ""}
          players={gameState.players}
          category={gameState.category}
          impostorCount={gameState.impostorCount}
          isAdmin={isAdmin}
          currentPlayerId={currentPlayerId}
          onBack={handleBack}
          onStartGame={handleStartMultiplayerGame}
        />
      )}

      {screen === "playing" && gameState && (
        <TurnView
          players={gameState.players}
          currentTurnIndex={gameState.currentTurnIndex}
          currentPlayerId={currentPlayerId}
          isMultiplayer={gameState.mode === "multiplayer"}
          isAdmin={isAdmin}
          startingPlayer={gameState.startingPlayer}
          myPlayerData={gameState.myPlayerData}
          onNextTurn={handleNextTurn}
          onRestart={handleRestart}
          onPlayAgain={handlePlayAgain}
          onKickPlayer={gameState.mode === "multiplayer" ? handleKickPlayer : undefined}
          onSkipTurn={gameState.mode === "multiplayer" ? handleSkipTurn : undefined}
          onGoToClues={gameState.mode === "multiplayer" ? handleGoToClues : undefined}
        />
      )}

      {(screen === "clues" || screen === "voting" || screen === "results") && gameState && (
        <CluesVoting
          phase={screen}
          players={gameState.players}
          currentPlayerId={currentPlayerId}
          clues={gameState.clues || []}
          votes={gameState.votes || []}
          hasVoted={gameState.hasVoted || false}
          isAdmin={isAdmin}
          onSubmitClue={handleSubmitClue}
          onSubmitVote={handleSubmitVote}
          onStartVoting={handleStartVoting}
          onPlayAgain={handlePlayAgain}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
