import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  type Player, 
  type Category, 
  categoryWords, 
  playerColors 
} from "@shared/schema";

interface ClueEntry {
  playerId: string;
  playerName: string;
  clue: string;
}

interface Vote {
  voterId: string;
  voterName: string;
  votedForId: string;
}

interface Room {
  code: string;
  players: Player[];
  category: Category;
  impostorCount: number;
  adminId: string;
  gameStarted: boolean;
  currentTurnIndex: number;
  startingPlayer?: string;
  gamePhase: "playing" | "clues" | "voting" | "results";
  clues: ClueEntry[];
  votes: Vote[];
}

interface ClientConnection {
  socket: WebSocket;
  playerId: string;
  roomCode?: string;
}

const rooms = new Map<string, Room>();
const clients = new Map<WebSocket, ClientConnection>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function assignRolesAndWords(
  players: Player[],
  category: Category,
  impostorCount: number
): Player[] {
  const wordPairs = categoryWords[category];
  const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  const impostorIndices = new Set<number>();
  while (impostorIndices.size < Math.min(impostorCount, shuffledPlayers.length - 1)) {
    impostorIndices.add(Math.floor(Math.random() * shuffledPlayers.length));
  }

  const civilWord = randomPair.palabra;
  const impostorHint = randomPair.pista;

  return shuffledPlayers.map((player, index) => {
    const isImpostor = impostorIndices.has(index);
    return {
      ...player,
      role: isImpostor ? "impostor" : "civil",
      word: isImpostor ? impostorHint : civilWord,
    };
  });
}

function getPublicPlayers(players: Player[]) {
  return players.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isAdmin: p.isAdmin,
  }));
}

function broadcastToRoom(roomCode: string, message: object, excludeSocket?: WebSocket) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clients.forEach((client, socket) => {
    if (client.roomCode === roomCode && socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  });
}

function sendToClient(socket: WebSocket, message: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket: WebSocket) => {
    console.log("New WebSocket connection");

    socket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(socket, message);
      } catch (error) {
        console.error("Failed to parse message:", error);
        sendToClient(socket, { type: "error", payload: { message: "Invalid message format" } });
      }
    });

    socket.on("close", () => {
      const client = clients.get(socket);
      if (client && client.roomCode) {
        const room = rooms.get(client.roomCode);
        if (room) {
          room.players = room.players.filter((p) => p.id !== client.playerId);

          if (room.players.length === 0) {
            rooms.delete(client.roomCode);
          } else {
            if (room.adminId === client.playerId && room.players.length > 0) {
              room.adminId = room.players[0].id;
              room.players[0].isAdmin = true;
            }

            broadcastToRoom(client.roomCode, {
              type: "playerLeft",
              payload: { players: getPublicPlayers(room.players) },
            });
          }
        }
      }
      clients.delete(socket);
    });
  });

  function handleMessage(socket: WebSocket, message: { type: string; payload: unknown }) {
    switch (message.type) {
      case "createRoom": {
        const payload = message.payload as {
          roomCode: string;
          playerName: string;
          playerId: string;
          category: Category;
          impostorCount: number;
        };

        const player: Player = {
          id: payload.playerId,
          name: payload.playerName,
          color: playerColors[0],
          isAdmin: true,
        };

        const room: Room = {
          code: payload.roomCode,
          players: [player],
          category: payload.category,
          impostorCount: payload.impostorCount,
          adminId: payload.playerId,
          gameStarted: false,
          currentTurnIndex: 0,
          gamePhase: "playing",
          clues: [],
          votes: [],
        };

        rooms.set(payload.roomCode, room);
        clients.set(socket, {
          socket,
          playerId: payload.playerId,
          roomCode: payload.roomCode,
        });

        sendToClient(socket, {
          type: "roomState",
          payload: {
            roomCode: room.code,
            players: getPublicPlayers(room.players),
            category: room.category,
            impostorCount: room.impostorCount,
            isAdmin: true,
            playerId: payload.playerId,
          },
        });
        break;
      }

      case "joinRoom": {
        const payload = message.payload as {
          roomCode: string;
          playerName: string;
          playerId: string;
        };

        const room = rooms.get(payload.roomCode);
        if (!room) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "Sala no encontrada" },
          });
          return;
        }

        if (room.gameStarted) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "La partida ya ha comenzado" },
          });
          return;
        }

        if (room.players.length >= 10) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "La sala está llena" },
          });
          return;
        }

        const player: Player = {
          id: payload.playerId,
          name: payload.playerName,
          color: playerColors[room.players.length % playerColors.length],
          isAdmin: false,
        };

        room.players.push(player);
        clients.set(socket, {
          socket,
          playerId: payload.playerId,
          roomCode: payload.roomCode,
        });

        sendToClient(socket, {
          type: "roomState",
          payload: {
            roomCode: room.code,
            players: getPublicPlayers(room.players),
            category: room.category,
            impostorCount: room.impostorCount,
            isAdmin: false,
            playerId: payload.playerId,
          },
        });

        broadcastToRoom(payload.roomCode, {
          type: "playerJoined",
          payload: { players: getPublicPlayers(room.players) },
        }, socket);
        break;
      }

      case "startGame": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);

        if (!room) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "Sala no encontrada" },
          });
          return;
        }

        const client = clients.get(socket);
        if (client?.playerId !== room.adminId) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "Solo el administrador puede iniciar" },
          });
          return;
        }

        if (room.players.length < 3) {
          sendToClient(socket, {
            type: "error",
            payload: { message: "Se necesitan al menos 3 jugadores" },
          });
          return;
        }

        const assignedPlayers = assignRolesAndWords(
          room.players,
          room.category,
          Math.min(room.impostorCount, room.players.length - 1)
        );

        room.players = assignedPlayers;
        room.gameStarted = true;
        room.currentTurnIndex = 0;
        room.gamePhase = "playing";
        room.clues = [];
        room.votes = [];
        room.startingPlayer = assignedPlayers[
          Math.floor(Math.random() * assignedPlayers.length)
        ].name;

        clients.forEach((clientConn, clientSocket) => {
          if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
            const playerData = room.players.find((p) => p.id === clientConn.playerId);
            sendToClient(clientSocket, {
              type: "gameStarted",
              payload: {
                player: playerData,
                currentTurnIndex: room.currentTurnIndex,
                totalPlayers: room.players.length,
                startingPlayer: room.startingPlayer,
                publicPlayers: getPublicPlayers(room.players),
                gamePhase: room.gamePhase,
              },
            });
          }
        });
        break;
      }

      case "nextTurn": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);

        if (!room) return;

        room.currentTurnIndex++;

        broadcastToRoom(payload.roomCode, {
          type: "turnUpdate",
          payload: {
            currentTurnIndex: room.currentTurnIndex,
            currentPlayerName: room.players[room.currentTurnIndex]?.name || "",
          },
        });
        break;
      }

      case "skipTurn": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || client?.playerId !== room.adminId) return;

        room.currentTurnIndex++;

        broadcastToRoom(payload.roomCode, {
          type: "turnUpdate",
          payload: {
            currentTurnIndex: room.currentTurnIndex,
            currentPlayerName: room.players[room.currentTurnIndex]?.name || "",
          },
        });
        break;
      }

      case "kickPlayer": {
        const payload = message.payload as { roomCode: string; playerId: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || client?.playerId !== room.adminId) return;
        if (payload.playerId === room.adminId) return;

        const kickedPlayerIndex = room.players.findIndex(p => p.id === payload.playerId);
        if (kickedPlayerIndex === -1) return;

        room.players = room.players.filter(p => p.id !== payload.playerId);

        if (room.currentTurnIndex >= room.players.length) {
          room.currentTurnIndex = room.players.length;
        } else if (kickedPlayerIndex <= room.currentTurnIndex) {
          room.currentTurnIndex = Math.max(0, room.currentTurnIndex);
        }

        clients.forEach((clientConn, clientSocket) => {
          if (clientConn.playerId === payload.playerId) {
            sendToClient(clientSocket, {
              type: "kicked",
              payload: { message: "Has sido expulsado de la sala" },
            });
            clientConn.roomCode = undefined;
          }
        });

        broadcastToRoom(payload.roomCode, {
          type: "playerKicked",
          payload: {
            players: getPublicPlayers(room.players),
            currentTurnIndex: room.currentTurnIndex,
          },
        });
        break;
      }

      case "playAgain": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || client?.playerId !== room.adminId) return;

        const playersWithoutRoles = room.players.map(p => ({
          ...p,
          role: undefined,
          word: undefined,
        }));

        const assignedPlayers = assignRolesAndWords(
          playersWithoutRoles,
          room.category,
          Math.min(room.impostorCount, playersWithoutRoles.length - 1)
        );

        room.players = assignedPlayers;
        room.currentTurnIndex = 0;
        room.gamePhase = "playing";
        room.clues = [];
        room.votes = [];
        room.startingPlayer = assignedPlayers[
          Math.floor(Math.random() * assignedPlayers.length)
        ].name;

        clients.forEach((clientConn, clientSocket) => {
          if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
            const playerData = room.players.find((p) => p.id === clientConn.playerId);
            sendToClient(clientSocket, {
              type: "gameStarted",
              payload: {
                player: playerData,
                currentTurnIndex: room.currentTurnIndex,
                totalPlayers: room.players.length,
                startingPlayer: room.startingPlayer,
                publicPlayers: getPublicPlayers(room.players),
                gamePhase: room.gamePhase,
              },
            });
          }
        });
        break;
      }

      case "startClues": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || client?.playerId !== room.adminId) return;

        room.gamePhase = "clues";
        room.clues = [];
        room.votes = [];

        const cluesMessage = {
          type: "cluesStarted",
          payload: {
            gamePhase: "clues",
            clues: [],
            votes: [],
          },
        };
        
        clients.forEach((clientConn, clientSocket) => {
          if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
            sendToClient(clientSocket, cluesMessage);
          }
        });
        break;
      }

      case "submitClue": {
        const payload = message.payload as { roomCode: string; clue: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || !client) return;

        const player = room.players.find(p => p.id === client.playerId);
        if (!player) return;

        const existingClue = room.clues.find(c => c.playerId === client.playerId);
        if (existingClue) return;

        room.clues.push({
          playerId: client.playerId,
          playerName: player.name,
          clue: payload.clue,
        });

        broadcastToRoom(payload.roomCode, {
          type: "clueSubmitted",
          payload: {
            clues: room.clues,
            allSubmitted: room.clues.length === room.players.length,
          },
        });
        break;
      }

      case "startVoting": {
        const payload = message.payload as { roomCode: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || client?.playerId !== room.adminId) return;

        room.gamePhase = "voting";
        room.votes = [];

        const votingMessage = {
          type: "votingStarted",
          payload: {
            gamePhase: "voting",
            players: getPublicPlayers(room.players),
            votes: [],
            clues: room.clues,
          },
        };

        clients.forEach((clientConn, clientSocket) => {
          if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
            sendToClient(clientSocket, votingMessage);
          }
        });
        break;
      }

      case "submitVote": {
        const payload = message.payload as { roomCode: string; votedForId: string };
        const room = rooms.get(payload.roomCode);
        const client = clients.get(socket);

        if (!room || !client || room.gamePhase !== "voting") return;

        const voter = room.players.find(p => p.id === client.playerId);
        if (!voter) return;

        const existingVote = room.votes.find(v => v.voterId === client.playerId);
        if (existingVote) return;

        room.votes.push({
          voterId: client.playerId,
          voterName: voter.name,
          votedForId: payload.votedForId,
        });

        const allVoted = room.votes.length === room.players.length;

        if (allVoted) {
          room.gamePhase = "results";
          const resultsMessage = {
            type: "votingResults",
            payload: {
              gamePhase: "results",
              votes: room.votes,
              players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                role: p.role,
                word: p.word,
              })),
            },
          };
          
          clients.forEach((clientConn, clientSocket) => {
            if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
              sendToClient(clientSocket, resultsMessage);
            }
          });
        } else {
          const votedPlayerIds = room.votes.map(v => v.voterId);
          const progressMessage = {
            type: "voteSubmitted",
            payload: {
              votesCount: room.votes.length,
              totalPlayers: room.players.length,
              votedPlayerIds,
              votes: room.votes,
            },
          };
          
          clients.forEach((clientConn, clientSocket) => {
            if (clientConn.roomCode === payload.roomCode && clientSocket.readyState === WebSocket.OPEN) {
              sendToClient(clientSocket, progressMessage);
            }
          });
        }
        break;
      }
    }
  }

  return httpServer;
}
