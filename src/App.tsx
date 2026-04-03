import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import AuthModal from './components/AuthModal';
import { addScore, getUserScores, ScoreEntry } from './lib/auth';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import keyIcon from './assets/key.png';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

type CurrentUser = { type: 'guest' } | { type: 'user'; username: string };

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ type: 'guest' });
  const [showHistory, setShowHistory] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleSignIn = (username: string) => {
    setCurrentUser({ type: 'user', username });
    setShowAuthModal(false);
    initializeGame();
  };

  const handleSignUp = (username: string) => {
    setCurrentUser({ type: 'user', username });
    setShowAuthModal(false);
    initializeGame();
  };

  const handleSignOut = () => {
    setCurrentUser({ type: 'guest' });
    initializeGame();
  };

  const handleShowHistory = async () => {
    if (currentUser?.type === 'user') {
      const history = await getUserScores(currentUser.username);
      setScoreHistory(history);
      setShowHistory(true);
    }
  };

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpen) return;

    if (box.hasTreasure) {
      new Audio(chestOpenSound).play();
    } else {
      new Audio(evilLaughSound).play();
    }

    // Compute the new score here to avoid stale closure inside setBoxes
    const newScore = box.hasTreasure ? score + 200 : score - 50;
    setScore(newScore);

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(b =>
        b.id === boxId && !b.isOpen ? { ...b, isOpen: true } : b
      );

      const treasureFound = updatedBoxes.some(b => b.isOpen && b.hasTreasure);
      const allOpened = updatedBoxes.every(b => b.isOpen);

      if (treasureFound || allOpened) {
        setGameEnded(true);
        if (currentUser?.type === 'user') {
          addScore(currentUser.username, newScore, treasureFound).then(() => {
            setNotification('Score saved! 🏆');
            setTimeout(() => setNotification(null), 3000);
          });
        } else {
          setNotification('Sign in to save your score! 💡');
          setTimeout(() => setNotification(null), 3000);
        }
      }

      return updatedBoxes;
    });
  };

  const resetGame = () => {
    initializeGame();
  };

  const bestScore = scoreHistory.length > 0 ? Math.max(...scoreHistory.map(s => s.score)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {notification}
        </div>
      )}

      <AuthModal
        open={showAuthModal}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Header bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          {currentUser.type === 'user' ? (
            <Badge className="bg-amber-600 text-white text-sm px-3 py-1">
              👤 {currentUser.username}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-400 text-amber-700 text-sm px-3 py-1">
              Guest Mode
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentUser.type === 'user' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowHistory}
              className="border-amber-400 text-amber-800 hover:bg-amber-100"
            >
              My Scores
            </Button>
          )}
          {currentUser.type === 'user' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-amber-400 text-amber-800 hover:bg-amber-100"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign in / Sign up
            </Button>
          )}
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$200 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
          {gameEnded && (
            <div className="mt-2 font-bold">
              <span className={score > 0 ? 'text-green-600' : score === 0 ? 'text-amber-900' : 'text-red-600'}>
                {score > 0 ? 'Win' : score === 0 ? 'Tie' : 'Lose'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center"
            style={{ cursor: box.isOpen ? 'default' : `url(${keyIcon}) 16 16, pointer` }}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: box.isOpen ? 180 : 0,
                scale: box.isOpen ? 1.1 : 1
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <img
                src={box.isOpen
                  ? (box.hasTreasure ? treasureChest : skeletonChest)
                  : closedChest
                }
                alt={box.isOpen
                  ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                  : "Treasure Chest"
                }
                className="w-48 h-48 object-contain drop-shadow-lg"
              />

              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$200' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">
                  Click to open!
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${score}
              </span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>
          </div>

          <Button
            onClick={resetGame}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Play Again
          </Button>
        </motion.div>
      )}

      {/* Score History Dialog */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/80 backdrop-blur-sm">
          <div className="w-[800px] bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-400 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-3 right-4 text-amber-400 hover:text-amber-700 text-xl font-bold"
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-amber-900 mb-4">🏆 My Score History</h2>
            {scoreHistory.length === 0 ? (
              <p className="text-amber-700 text-center py-4">
                No games played yet — go find some treasure!
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {scoreHistory.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-amber-100 rounded-lg border border-amber-200"
                    >
                      <span className="text-amber-700 text-xs">
                        {new Date(entry.playedAt).toLocaleDateString()} {new Date(entry.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge className={entry.won ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}>
                        {entry.won ? 'Win' : 'Loss'}
                      </Badge>
                      <span className={`font-bold ${entry.score >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        ${entry.score}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-amber-300 text-sm text-amber-800 flex justify-between">
                  <span>{scoreHistory.length} game{scoreHistory.length !== 1 ? 's' : ''} played</span>
                  {bestScore !== null && <span>Best: <strong>${bestScore}</strong></span>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
