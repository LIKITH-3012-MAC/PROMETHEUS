
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dices, Hand, Scissors, Gem, RotateCcw, BrainCircuit, User, CircleHelp, Cpu, Server, Database, Router, Microchip, Code, Users, QrCode, Clipboard, Check, Loader2, Wifi, Computer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { VictoryCelebration } from '../victory-celebration';


// --- QR Code Dialog ---
const QRCodeDialog = ({ open, onOpenChange, url }: { open: boolean; onOpenChange: (open: boolean) => void; url: string }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        toast({ title: "Copied to clipboard!" });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Play with a Friend</DialogTitle>
                    <DialogDescription>
                        Scan the QR code or share the link with a friend to start the game.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4 gap-4">
                    <div className="p-4 bg-white rounded-lg">
                        <QRCode value={url} size={192} />
                    </div>
                    <div className="flex items-center space-x-2 w-full">
                        <Input id="link" value={url} readOnly />
                        <Button type="button" size="icon" onClick={handleCopy}>
                            {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const FriendLobby = ({ username }: { username: string }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleFriendGameStart = async () => {
        setIsLoading(true);
        try {
            const gameSessionsRef = collection(db, 'tictactoe_sessions');
            const newGameRef = doc(gameSessionsRef);
            
            await setDoc(newGameRef, {
                player1: { name: username, symbol: 'X' },
                player2: null,
                board: Array(9).fill(null),
                isXNext: true,
                status: 'waiting',
                winner: null,
                winningLine: [],
                createdAt: serverTimestamp(),
            });
            
            router.push(`/tictactoe?online=true&sessionId=${newGameRef.id}`);

        } catch (err) {
            console.error("Failed to create game:", err);
            toast({
                variant: 'destructive',
                title: 'Error creating game',
                description: 'Could not create a new game session. Please try again later.',
            });
             setIsLoading(false);
        }
    }
    
    return (
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-500 w-full max-w-sm">
            <h3 className="text-xl font-semibold">Play with a Friend (Online)</h3>
             <CardDescription>Generate a shareable link to play with a friend on any device.</CardDescription>
            <div className="w-full space-y-4 text-left">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="player1">Player 1 (X)</Label>
                    <Input id="player1" value={username} disabled />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="player2" className="text-muted-foreground">Player 2 (O)</Label>
                    <Input id="player2" value="Joins via link" disabled />
                </div>
            </div>
            <Button onClick={handleFriendGameStart} disabled={isLoading} className="w-full">
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Game...
                    </>
                ) : (
                   "Generate Game Link"
                )}
            </Button>
             <Button variant="link" onClick={() => (window.location.href = '/')}>Back to Lobby</Button>
        </div>
    );
};


// --- Player Selection Component ---
const PlayerSelection = ({ onSelectMode }: { onSelectMode: (mode: 'ai' | 'local' | 'online') => void }) => {
    return (
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-500">
            <h3 className="text-xl font-semibold">How do you want to play?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => onSelectMode('ai')} variant="outline" size="lg" className="w-full sm:w-auto">
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    Play Against AI
                </Button>
                 <Button onClick={() => onSelectMode('local')} variant="outline" size="lg" className="w-full sm:w-auto">
                     <Users className="mr-2 h-5 w-5" />
                    Play on this Device
                </Button>
                <Button onClick={() => onSelectMode('online')} variant="outline" size="lg" className="w-full sm:w-auto">
                     <Wifi className="mr-2 h-5 w-5" />
                    Play with Friend (Online)
                </Button>
            </div>
        </div>
    );
}

type BoardState = Array<'X' | 'O' | null>;

const calculateWinner = (squares: BoardState) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return { winner: null, line: [] };
};

const TicTacToeAISquare = ({ value, onClick, isWinning }: { value: 'X' | 'O' | null; onClick: () => void; isWinning: boolean }) => (
  <button
    className={cn(
      "flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-card/50 border-2 border-primary/20 rounded-lg text-4xl sm:text-5xl font-bold transition-all duration-200 hover:bg-primary/10 hover:border-primary/80 disabled:cursor-not-allowed",
      isWinning && "bg-primary/30 border-primary shadow-lg shadow-primary/50"
    )}
    onClick={onClick}
    disabled={!!value}
  >
    {value === 'X' && <User className="w-12 h-12 text-accent animate-in fade-in zoom-in-50" />}
    {value === 'O' && <BrainCircuit className="w-12 h-12 text-primary animate-in fade-in zoom-in-50" />}
  </button>
);


const TicTacToeAI = ({ username, onBack }: { username: string, onBack: () => void }) => {
    const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
    const [winningLine, setWinningLine] = useState<number[]>([]);
    
    const checkGameEnd = (currentBoard: BoardState) => {
        const { winner: newWinner, line } = calculateWinner(currentBoard);
        if (newWinner) {
            setWinner(newWinner);
            setWinningLine(line);
            return true;
        }
        if (currentBoard.every(Boolean)) {
            setWinner('draw');
            return true;
        }
        return false;
    };

    const aiMove = useCallback((currentBoard: BoardState) => {
        // --- AI Dominance Logic ---
        const findBestMove = () => {
            // 1. Check for AI winning move
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    const testBoard = [...currentBoard];
                    testBoard[i] = 'O';
                    if (calculateWinner(testBoard).winner === 'O') {
                        return i;
                    }
                }
            }
            // 2. Check to block player's winning move
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    const testBoard = [...currentBoard];
                    testBoard[i] = 'X';
                    if (calculateWinner(testBoard).winner === 'X') {
                        return i;
                    }
                }
            }
            // 3. Take the center if available
            if (currentBoard[4] === null) return 4;

            // 4. Take opposite corner
            if (currentBoard[0] === 'X' && currentBoard[8] === null) return 8;
            if (currentBoard[8] === 'X' && currentBoard[0] === null) return 0;
            if (currentBoard[2] === 'X' && currentBoard[6] === null) return 6;
            if (currentBoard[6] === 'X' && currentBoard[2] === null) return 2;
            
            // 5. Take an empty corner
            const corners = [0, 2, 6, 8];
            const emptyCorners = corners.filter(i => currentBoard[i] === null);
            if (emptyCorners.length > 0) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
            
            // 6. Take an empty side
            const sides = [1, 3, 5, 7];
            const emptySides = sides.filter(i => currentBoard[i] === null);
            if (emptySides.length > 0) return emptySides[Math.floor(Math.random() * emptySides.length)];

            return null; // Should not be reached if there are moves left
        }

        const move = findBestMove();
        if (move !== null) {
            const newBoard = [...currentBoard];
            newBoard[move] = 'O';
            setBoard(newBoard);
            if (!checkGameEnd(newBoard)) {
                setIsPlayerTurn(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!isPlayerTurn && !winner) {
            const timeout = setTimeout(() => aiMove(board), 500); // AI thinks for a bit
            return () => clearTimeout(timeout);
        }
    }, [isPlayerTurn, winner, board, aiMove]);


    const handlePlayerMove = (index: number) => {
        if (!isPlayerTurn || board[index] || winner) return;

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);
        
        if (!checkGameEnd(newBoard)) {
            setIsPlayerTurn(false);
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsPlayerTurn(true);
        setWinner(null);
        setWinningLine([]);
    };
    
    let statusText;
    let winnerName = null;
    if (winner) {
        if (winner === 'draw') {
            statusText = "It's a Draw!";
        } else if (winner === 'X') {
            winnerName = username;
            statusText = `${username} Won!`;
        } else {
            winnerName = 'Prometheus AI';
            statusText = "Prometheus AI Won!";
        }
    } else {
        statusText = isPlayerTurn ? `${username}'s Turn` : "AI is thinking...";
    }

    return (
         <>
            {winner && winnerName && <VictoryCelebration winnerName={winnerName} />}
            <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in-0 duration-500 w-full">
                <div className="text-center">
                    <div className={cn("text-xl font-semibold px-4 py-2 rounded-md transition-colors", winner ? 'text-primary-foreground bg-primary' : 'text-foreground/80 bg-muted/50')}>{statusText}</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {board.map((val, i) => (
                        <TicTacToeAISquare
                            key={i}
                            value={val}
                            onClick={() => handlePlayerMove(i)}
                            isWinning={winningLine.includes(i)}
                        />
                    ))}
                </div>
                <div className="flex gap-4 mt-2">
                    <Button onClick={resetGame} variant="outline">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {winner ? 'Play Again' : 'Reset Game'}
                    </Button>
                    <Button onClick={onBack} variant="outline">Back to Lobby</Button>
                </div>
            </div>
        </>
    );
};


const TicTacToeLobby = ({ username }: { username: string }) => {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'local' | 'online' | 'ai'>('select');
  
  const handleSelectMode = (selectedMode: 'ai' | 'local' | 'online') => {
    setMode(selectedMode);
  }
  
  const handleLobbyStart = (player1: string, player2: string) => {
    router.push(`/tictactoe?p1=${encodeURIComponent(player1)}&p2=${encodeURIComponent(player2)}`);
  }

  const LocalLobby = () => {
    const [player1, setPlayer1] = useState(username);
    const [player2, setPlayer2] = useState('');
    
    return (
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-500 w-full max-w-sm">
            <h3 className="text-xl font-semibold">Local Game</h3>
             <CardDescription>Enter names for both players.</CardDescription>
            <div className="w-full space-y-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="player1">Player 1 (X)</Label>
                    <Input id="player1" value={player1} onChange={e => setPlayer1(e.target.value)} placeholder="Enter Player 1 Name" />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="player2">Player 2 (O)</Label>
                    <Input id="player2" value={player2} onChange={e => setPlayer2(e.target.value)} placeholder="Enter Player 2 Name" />
                </div>
            </div>
            <Button onClick={() => handleLobbyStart(player1, player2)} disabled={!player1.trim() || !player2.trim()} className="w-full">
                Start Local Game
            </Button>
            <Button variant="link" onClick={() => setMode('select')}>Back</Button>
        </div>
    )
  }
  
  const renderLobbyContent = () => {
    switch(mode) {
        case 'select':
            return <PlayerSelection onSelectMode={handleSelectMode} />;
        case 'local':
            return <LocalLobby />
        case 'online':
            return <FriendLobby username={username} />;
        case 'ai':
            return <TicTacToeAI username={username} onBack={() => setMode('select')} />;
        default:
            return <PlayerSelection onSelectMode={handleSelectMode} />;
    }
  }

  return (
    <>
        <Card className="w-full bg-card/50 border-primary/20 backdrop-blur-sm min-h-[480px]">
            <CardHeader className="items-center">
                <CardTitle>Tic-Tac-Toe</CardTitle>
                 {mode === 'select' && <CardDescription>A classic game of Xs and Os.</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                {renderLobbyContent()}
            </CardContent>
        </Card>
    </>
  );
};


// --- Rock Paper Scissors Components ---
const moves = {
  rock: { name: 'Rock', icon: Hand, defeats: 'scissors' },
  paper: { name: 'Paper', icon: Gem, defeats: 'rock' }, // Using Gem for Paper
  scissors: { name: 'Scissors', icon: Scissors, defeats: 'paper' },
};

type Move = keyof typeof moves;

const RockPaperScissors = ({ username }: { username: string }) => {
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [computerMove, setComputerMove] = useState<Move | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [winner, setWinner] = useState<string|null>(null);

  const handlePlayerMove = (move: Move) => {
    setWinner(null);
    const computerMoveKeys = Object.keys(moves) as Move[];
    const randomMove = computerMoveKeys[Math.floor(Math.random() * computerMoveKeys.length)];

    setPlayerMove(move);
    setComputerMove(randomMove);

    if (move === randomMove) {
      setResult("It's a tie!");
    } else if (moves[move].defeats === randomMove) {
      setResult('You win this round!');
      setScores(s => ({ ...s, player: s.player + 1 }));
      setWinner(username);
    } else {
      setResult('AI wins this round!');
      setScores(s => ({ ...s, computer: s.computer + 1 }));
      setWinner('Prometheus AI');
    }
  };
  
  const resetGame = () => {
    setPlayerMove(null);
    setComputerMove(null);
    setResult(null);
    setScores({ player: 0, computer: 0 });
    setWinner(null);
  };

  return (
    <Card className="w-full bg-card/50 border-primary/20 backdrop-blur-sm min-h-[550px] relative">
        {winner && <VictoryCelebration winnerName={winner} />}
        <CardHeader className="items-center">
            <CardTitle>Rock Paper Scissors</CardTitle>
            <CardDescription>Can you beat the AI?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
            <div className="flex justify-around w-full text-center p-4 rounded-lg bg-muted/40">
                <div>
                    <p className="text-lg font-bold flex items-center gap-2"><User className='w-5 h-5'/>{username}</p>
                    <p className="text-4xl font-bold text-primary">{scores.player}</p>
                </div>
                 <div className="h-16 border-l border-border"></div>
                 <div>
                    <p className="text-lg font-bold flex items-center gap-2"><BrainCircuit className='w-5 h-5' />Computer</p>
                    <p className="text-4xl font-bold text-accent">{scores.computer}</p>
                </div>
            </div>

            <div className="flex justify-center items-center gap-8 min-h-[100px] w-full">
                <div className="flex-1 flex flex-col items-center gap-2">
                    {playerMove ? React.createElement(moves[playerMove].icon, { className: "w-12 h-12 text-primary" }) : <div className='w-12 h-12 flex items-center justify-center'><CircleHelp className='w-10 h-10 text-primary/30' /></div>}
                    <p className='font-semibold'>{playerMove ? moves[playerMove].name : 'Your Move'}</p>
                </div>
                <p className="text-2xl font-bold">vs</p>
                 <div className="flex-1 flex flex-col items-center gap-2">
                    {computerMove ? React.createElement(moves[computerMove].icon, { className: "w-12 h-12 text-accent" }) : <div className='w-12 h-12 flex items-center justify-center'><CircleHelp className='w-10 h-10 text-accent/30' /></div>}
                    <p className='font-semibold'>{computerMove ? moves[computerMove].name : 'AI Move'}</p>
                </div>
            </div>

            {result && <p className="text-xl font-semibold animate-in fade-in zoom-in-50 p-2 px-4 rounded-md bg-muted">{result}</p>}
            
             <p className="text-sm text-muted-foreground">Choose your weapon:</p>
            <div className="flex justify-center gap-4">
                {(Object.keys(moves) as Move[]).map(move => (
                    <Button key={move} variant="outline" size="icon" className="w-20 h-20 rounded-full hover:border-primary/80 hover:bg-primary/10 transition-all duration-200" onClick={() => handlePlayerMove(move)} disabled={!!winner}>
                        {React.createElement(moves[move].icon, { className: "w-10 h-10" })}
                    </Button>
                ))}
            </div>

            <Button onClick={resetGame} variant="outline" className='mt-4'>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Scores
            </Button>
        </CardContent>
    </Card>
  );
}


// --- Memory Match Game ---
const icons = [
    { icon: Cpu, name: 'cpu' }, { icon: Microchip, name: 'chip' }, 
    { icon: Router, name: 'router' }, { icon: Server, name: 'server' }, 
    { icon: Database, name: 'database' }, { icon: Code, name: 'code' },
];

const MemoryMatch = ({ username }: { username: string }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [movesCount, setMovesCount] = useState(0);
    const [isGameWon, setIsGameWon] = useState(false);

    const shuffleAndDeal = useCallback(() => {
        const gameIcons = [...icons, ...icons]; // Duplicate for pairs
        const shuffledIcons = gameIcons.sort(() => Math.random() - 0.5);
        setCards(shuffledIcons.map((item, index) => ({ ...item, id: index, isFlipped: false })));
        setFlippedIndices([]);
        setMatchedPairs([]);
        setMovesCount(0);
        setIsGameWon(false);
    }, []);

    useEffect(() => {
        shuffleAndDeal();
    }, [shuffleAndDeal]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setMovesCount(m => m + 1);
            const [firstIndex, secondIndex] = flippedIndices;
            if (cards[firstIndex].name === cards[secondIndex].name) {
                // It's a match!
                setMatchedPairs(prev => [...prev, cards[firstIndex].name]);
                setFlippedIndices([]);
            } else {
                // Not a match
                setTimeout(() => {
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    }, [flippedIndices, cards]);

    useEffect(() => {
      if (matchedPairs.length > 0 && matchedPairs.length === icons.length) {
        setIsGameWon(true);
      }
    }, [matchedPairs]);

    const handleCardClick = (index: number) => {
        if (isGameWon || flippedIndices.length === 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index].name)) {
            return; // Prevent clicking more than 2 cards, the same card, or matched cards
        }
        setFlippedIndices(prev => [...prev, index]);
    };

    return (
        <Card className="w-full bg-card/50 border-primary/20 backdrop-blur-sm min-h-[550px] relative">
            {isGameWon && <VictoryCelebration winnerName={username} />}
            <CardHeader className="items-center">
                <CardTitle>Memory Match</CardTitle>
                <CardDescription>Find all the matching pairs of icons.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="flex justify-between w-full max-w-xs text-center p-3 rounded-lg bg-muted/40">
                    <p className="text-lg font-bold">Moves: <span className="text-primary">{movesCount}</span></p>
                    <p className="text-lg font-bold">Pairs Found: <span className="text-accent">{matchedPairs.length} / {icons.length}</span></p>
                </div>

                <div className="grid grid-cols-4 gap-3 perspective-800">
                    {cards.map((card, index) => {
                        const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card.name);
                        return (
                            <div key={index} className="w-16 h-16 sm:w-20 sm:h-20" onClick={() => handleCardClick(index)}>
                                <div className={cn("relative w-full h-full transition-transform duration-500 preserve-3d", isFlipped && "[transform:rotateY(180deg)]")}>
                                    {/* Card Back */}
                                    <div className="absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center bg-primary/20 border-2 border-primary/30 cursor-pointer hover:border-primary">
                                        <Dices className="w-8 h-8 text-primary/70" />
                                    </div>
                                    {/* Card Front */}
                                    <div className={cn("absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center [transform:rotateY(180deg)]",
                                        matchedPairs.includes(card.name) ? 'bg-green-500/20 border-2 border-green-500' : 'bg-muted'
                                    )}>
                                        {React.createElement(card.icon, { className: "w-10 h-10 text-foreground" })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <Button onClick={shuffleAndDeal} variant="outline" className='mt-4'>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Game
                </Button>
            </CardContent>
        </Card>
    );
};


// --- Main Games Component ---

export default function FunGames({ username }: { username: string }) {
  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg bg-card/70 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <Dices className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Game Center</CardTitle>
        </div>
        <CardDescription>Take a break and play a game.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tic-tac-toe" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/80">
                <TabsTrigger value="tic-tac-toe"><User className="w-4 h-4 mr-2" />Tic-Tac-Toe</TabsTrigger>
                <TabsTrigger value="rock-paper-scissors"><Scissors className="w-4 h-4 mr-2" />Rock Paper Scissors</TabsTrigger>
                <TabsTrigger value="memory-match"><BrainCircuit className="w-4 h-4 mr-2" />Memory Match</TabsTrigger>
            </TabsList>
            <TabsContent value="tic-tac-toe" className="mt-4">
                <TicTacToeLobby username={username} />
            </TabsContent>
            <TabsContent value="rock-paper-scissors" className="mt-4">
                <RockPaperScissors username={username} />
            </TabsContent>
             <TabsContent value="memory-match" className="mt-4">
                <MemoryMatch username={username} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
