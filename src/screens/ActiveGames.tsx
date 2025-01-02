import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSocket } from '../hooks/useSocket';
import { MiniChessBoard } from '../components/MiniChessBoard';

interface Game {
  id: string;
  fen: string;
  turn: 'w' | 'b';
  status: string;
  lastMove?: {
    from: string;
    to: string;
  };
}

export const FETCH_GAMES = "fetch_games";
export const GAMES_LIST = "games_list";
export const GAME_STATES_UPDATE = "game_states_update";

export const ActiveGames: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(() => {
    if (!socket || !isConnected) {
      setError("Not connected to server");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Sending FETCH_GAMES message");
      socket.send(JSON.stringify({ type: FETCH_GAMES }));
    } catch (err) {
      console.error('Error sending fetch games request:', err);
      setError('Failed to fetch games');
      setLoading(false);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    let mounted = true;

    if (!socket || !isConnected) {
      if (mounted) {
        setLoading(false);
        setError("Not connected to server");
      }
      return;
    }

    console.log("Setting up message listener");

    const handleMessage = (event: MessageEvent) => {
      if (!mounted) return;

      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        if (message.type === GAMES_LIST || message.type === GAME_STATES_UPDATE) {
          console.log(`Received ${message.type}:`, message.payload.games);
          setGames(message.payload.games || []);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        if (mounted) {
          setError('Failed to process server response');
          setLoading(false);
        }
      }
    };

    socket.addEventListener('message', handleMessage);
    fetchGames();

    return () => {
      mounted = false;
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, isConnected, fetchGames]);

  const handleWatchGame = useCallback((gameId: string) => () => {
    navigate(`/spectate/${gameId}`);
  }, [navigate]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="text-center text-white text-xl py-12">
          Connecting to server...
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 py-12">
          <p className="text-xl">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchGames();
            }} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl">Loading games...</p>
        </div>
      );
    }

    if (games.length === 0) {
      return (
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl">No active games at the moment</p>
          <p className="mt-2">Start a new game or check back later</p>
          <Button onClick={() => navigate('/game')} className="mt-4">
            Start New Game
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map((game) => (
          <div 
            key={game.id}
            className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Game {game.id}</h3>
            <MiniChessBoard fen={game.fen} lastMove={game.lastMove} />
            <div className="text-gray-300 mt-2 flex justify-between items-center">
              <span className={`
                inline-block px-2 py-1 rounded text-sm
                ${game.status === 'In Progress' ? 'bg-green-600' :
                  game.status === 'Check' ? 'bg-yellow-600' :
                  'bg-red-600'}
              `}>
                {game.status}
              </span>
              <span className="text-sm">
                Turn: {game.turn === 'w' ? 'White' : 'Black'}
              </span>
            </div>
            <Button 
              onClick={handleWatchGame(game.id)}
              className="w-full mt-2"
            >
              Watch Game
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Active Games</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};