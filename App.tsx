import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/Button';
import { LevelSelector } from './components/LevelSelector';
import { ChatBubble } from './components/ChatBubble';
import { geminiService } from './services/geminiService';
import { dataService } from './services/dataService';
import { User, Level, GameState, ChatMessage } from './types';

const MAX_MISTAKES = 3;
const WINNING_SCORE = 100;

export default function App() {
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [user, setUser] = useState<User>({ name: '', level: Level.NOVATO, score: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pointNotification, setPointNotification] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]); 

  // --- ADMIN & DATA PERSISTENCE LOGIC ---

  const handleDownloadReport = async () => {
    setIsExporting(true);
    try {
      const data = await dataService.getAllSessions();
      
      if (data.length === 0) {
        alert("Ainda não há dados de partidas registrados no banco de dados.");
        setIsExporting(false);
        return;
      }

      // Create CSV content
      const headers = ["ID", "Data", "Nome", "Nivel", "Pontos", "Resultado"];
      const csvContent = [
        headers.join(","),
        ...data.map((row: any) => {
          const dateStr = row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '';
          return `${row.id},"${dateStr}",${row.player_name},${row.level},${row.score},${row.result}`;
        })
      ].join("\n");

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_suvinil_admin_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao conectar com o banco de dados.");
    } finally {
      setIsExporting(false);
    }
  };

  const isAdmin = user.name.trim().toLowerCase() === 'thiago';

  // --- GAME LOGIC ---

  // Handle Game Start
  const handleStartGame = async () => {
    if (!user.name) {
      alert("Por favor, digite seu nome.");
      return;
    }

    setGameState(GameState.PLAYING);
    setIsProcessing(true);
    setMistakes(0);
    setGameResult(null);
    setUser(prev => ({ ...prev, score: 0 }));
    
    // Initialize Chat
    geminiService.startChat();

    // Send initial context to AI (invisible to user in UI, but sets the stage)
    const initialPrompt = `Olá, meu nome é ${user.name} e eu escolhi o nível ${user.level}. Vamos começar o jogo!`;
    
    try {
      const response = await geminiService.sendMessage(initialPrompt);
      setMessages([{ 
        role: 'model', 
        text: response.text, 
        options: response.evaluation?.options 
      }]);
    } catch (error) {
      console.error("Error starting game:", error);
      setMessages([{ role: 'model', text: "Desculpe, tive um problema ao iniciar o treinamento. Tente recarregar a página." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Exit / Reset
  const handleExit = () => {
    setGameState(GameState.WELCOME);
    setMessages([]);
    setInputValue('');
    setUser(prev => ({ ...prev, score: 0 }));
    setMistakes(0);
    setPointNotification(null);
    setGameResult(null);
  };

  const triggerGameOver = (result: 'win' | 'lose') => {
    setGameResult(result);
    
    // Save data to Supabase asynchronously
    dataService.saveGameSession(user, result);
    
    // Add a small delay so user can see the last message/points
    setTimeout(() => {
        setGameState(GameState.GAMEOVER);
    }, 2500);
  };

  // Handle User Message
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await geminiService.sendMessage(userMsg.text);
      
      let currentScore = user.score;
      let currentMistakes = mistakes;

      // Logic to update Score and Mistakes based on AI evaluation
      if (response.evaluation) {
        // Ensure points are a number
        const rawPoints = response.evaluation.points;
        const pointsAwarded = typeof rawPoints === 'number' ? rawPoints : 0;
        const isCorrect = response.evaluation.correct === true;

        if (isCorrect && pointsAwarded > 0) {
          currentScore += pointsAwarded;
          setUser(prev => ({ ...prev, score: currentScore }));
          
          // Trigger Floating Points Animation
          setPointNotification(pointsAwarded);
          setTimeout(() => setPointNotification(null), 2500); 

        } else if (response.evaluation.correct === false) {
          // Only count as mistake if explicitly evaluated as false (not null)
          currentMistakes += 1;
          setMistakes(currentMistakes);
        }
      }

      const aiMsg: ChatMessage = { 
        role: 'model', 
        text: response.text,
        isEvaluation: !!response.evaluation,
        options: response.evaluation?.options
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // Check Game Over Conditions
      if (currentScore >= WINNING_SCORE) {
        triggerGameOver('win');
      } else if (currentMistakes >= MAX_MISTAKES) {
        triggerGameOver('lose');
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro de conexão. Tente novamente." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate Progress Percentage
  const progressPercentage = Math.min((user.score / WINNING_SCORE) * 100, 100);

  // UI: Welcome Screen
  if (gameState === GameState.WELCOME) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#FF6600] p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Mestre das Cores 🎨</h1>
            <p className="opacity-90">Treinamento Operação Tonalidade</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Identificação do Agente</label>
              <input 
                type="text" 
                placeholder="Digite seu nome..." 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF6600] focus:border-transparent outline-none transition"
                value={user.name}
                onChange={(e) => setUser({...user, name: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Selecione seu Desafio</label>
              <LevelSelector 
                selectedLevel={user.level} 
                onSelect={(lvl) => setUser({...user, level: lvl})} 
              />
            </div>

            <div className="space-y-4">
              <Button fullWidth onClick={handleStartGame} disabled={!user.name}>
                Iniciar Operação 🕵️‍♂️
              </Button>

              {/* Admin Button for Thiago */}
              {isAdmin && (
                <Button 
                  fullWidth 
                  variant="secondary" 
                  onClick={handleDownloadReport}
                  disabled={isExporting}
                  className="bg-gray-700 hover:bg-gray-800"
                >
                  {isExporting ? 'Baixando...' : '📂 Baixar Base de Dados (Admin)'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UI: Game Over Screen
  if (gameState === GameState.GAMEOVER) {
    return (
      <div className="min-h-screen bg-gray-900 bg-opacity-95 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden text-center relative">
          <div className={`p-8 ${gameResult === 'win' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
             <div className="text-6xl mb-4 animate-bounce">
                {gameResult === 'win' ? '🏆' : '😵'}
             </div>
             <h2 className="text-3xl font-bold">
                {gameResult === 'win' ? 'Missão Cumprida!' : 'Fim de Jogo!'}
             </h2>
             <p className="mt-2 opacity-90">
                {gameResult === 'win' 
                   ? 'Você dominou a arte da tonalidade!' 
                   : 'Não desanime, continue treinando!'}
             </p>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Pontuação</p>
                    <p className="text-3xl font-bold text-[#FF6600]">{user.score}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Nível</p>
                    <p className="text-lg font-bold text-gray-800 truncate">{user.level}</p>
                </div>
             </div>

             {gameResult === 'lose' && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                    Você atingiu o limite de {MAX_MISTAKES} erros. Revise o material de apoio.
                </div>
             )}

             <div className="space-y-3">
               <Button fullWidth onClick={handleStartGame}>
                  Jogar Novamente 🔄
               </Button>
               <Button fullWidth variant="outline" onClick={handleExit}>
                  Voltar ao Menu
               </Button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // UI: Game Screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-3 shrink-0">
            <button 
              onClick={handleExit}
              className="p-2 text-gray-400 hover:text-[#FF6600] hover:bg-orange-50 rounded-full transition-all duration-200 mr-1"
              title="Voltar ao Início"
              aria-label="Voltar ao Início"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="bg-orange-100 p-2 rounded-lg hidden sm:block">
                <span className="text-xl">🕵️‍♂️</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 leading-tight truncate max-w-[120px] sm:max-w-xs">{user.name}</h2>
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">{user.level}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 shrink-0">
             {/* Mistakes Counter */}
             <div className="flex flex-col items-end mr-2">
                 <span className="text-xs text-gray-400 uppercase font-semibold">Erros</span>
                 <div className="flex space-x-1">
                     {[...Array(MAX_MISTAKES)].map((_, i) => (
                         <span key={i} className={`h-2.5 w-2.5 rounded-full border border-red-100 ${i < mistakes ? 'bg-red-500' : 'bg-gray-200'}`}></span>
                     ))}
                 </div>
             </div>

             {/* Progress/Score Bar */}
             <div className="flex flex-col items-end w-32 sm:w-40">
                <div className="flex justify-between w-full items-baseline mb-1">
                   <span className="text-xs text-gray-400 uppercase font-semibold">Meta</span>
                   <span className="text-sm font-bold text-[#FF6600]">
                      {user.score} <span className="text-gray-400 text-xs">/ {WINNING_SCORE}</span>
                   </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#FF6600] h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,102,0,0.5)]" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((msg, idx) => {
              // Only show options on the very last message, and only if we are not processing a response
              const isLastMessage = idx === messages.length - 1;
              const showOptions = isLastMessage && !isProcessing && msg.role === 'model';
              
              return (
                <ChatBubble 
                  key={idx} 
                  message={msg} 
                  showOptions={showOptions}
                  onOptionSelect={handleSendMessage}
                />
              );
            })}
            
            {isProcessing && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-gray-200 text-gray-500 px-4 py-3 rounded-2xl rounded-tl-none text-sm font-medium">
                        Analisando caso... 🔍
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 relative">
          
          {/* Floating Points Notification */}
          {pointNotification !== null && (
            <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 pointer-events-none z-50 animate-float-up w-full text-center">
               <span 
                className="text-6xl font-black text-green-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                style={{ WebkitTextStroke: '2px white' }}
               >
                 +{pointNotification} pts! 🎯
               </span>
            </div>
          )}

          <div className="flex gap-3">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6600] transition shadow-sm"
              placeholder="Digite seu veredito..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isProcessing}
            />
            <Button 
              id="send-btn"
              onClick={() => handleSendMessage()} 
              disabled={isProcessing || !inputValue.trim()}
              className="px-6"
            >
               Enviar
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}