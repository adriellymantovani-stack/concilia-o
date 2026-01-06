
import React, { useState, useEffect, useMemo } from 'react';
import { CardAccount, Expense, SummaryStats } from './types';
import { extractExpensesFromStatement } from './services/geminiService';
import { 
  CreditCard, 
  Plus, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Receipt, 
  FileText,
  ChevronRight,
  PieChart as PieChartIcon,
  X,
  Camera
} from 'lucide-react';

const INITIAL_CARDS: CardAccount[] = [
  { id: '1', name: 'Nubank Principal', lastFourDigits: '4582', color: 'bg-purple-600', expenses: [] },
  { id: '2', name: 'Itaú Personalité', lastFourDigits: '1290', color: 'bg-orange-500', expenses: [] },
  { id: '3', name: 'Inter Corporativo', lastFourDigits: '8831', color: 'bg-orange-600', expenses: [] }
];

const App: React.FC = () => {
  const [cards, setCards] = useState<CardAccount[]>(() => {
    const saved = localStorage.getItem('expensy_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });
  const [activeCardId, setActiveCardId] = useState<string>(INITIAL_CARDS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  useEffect(() => {
    localStorage.setItem('expensy_cards', JSON.stringify(cards));
  }, [cards]);

  const activeCard = useMemo(() => 
    cards.find(c => c.id === activeCardId) || cards[0], 
    [cards, activeCardId]
  );

  const stats: SummaryStats = useMemo(() => {
    const expenses = activeCard.expenses;
    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const reconciledAmount = expenses
      .filter(e => e.receiptAttached)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = totalAmount - reconciledAmount;
    const completionPercentage = totalAmount > 0 ? (reconciledAmount / totalAmount) * 100 : 0;

    return { totalAmount, reconciledAmount, pendingAmount, completionPercentage };
  }, [activeCard]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const extracted = await extractExpensesFromStatement(file);
      addExpensesToActiveCard(extracted as Expense[]);
    } catch (error) {
      alert("Erro ao processar o extrato. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualImport = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    try {
      const extracted = await extractExpensesFromStatement(manualText);
      addExpensesToActiveCard(extracted as Expense[]);
      setManualText('');
      setShowManualInput(false);
    } catch (error) {
      alert("Erro ao processar o texto. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addExpensesToActiveCard = (newExpenses: Expense[]) => {
    setCards(prev => prev.map(card => {
      if (card.id === activeCardId) {
        return { ...card, expenses: [...card.expenses, ...newExpenses] };
      }
      return card;
    }));
  };

  const toggleReceipt = (expenseId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === activeCardId) {
        return {
          ...card,
          expenses: card.expenses.map(e => 
            e.id === expenseId ? { ...e, receiptAttached: !e.receiptAttached } : e
          )
        };
      }
      return card;
    }));
  };

  const deleteExpense = (expenseId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === activeCardId) {
        return {
          ...card,
          expenses: card.expenses.filter(e => e.id !== expenseId)
        };
      }
      return card;
    }));
  };

  const clearAllExpenses = () => {
    if (confirm("Tem certeza que deseja limpar todas as despesas deste cartão?")) {
      setCards(prev => prev.map(card => {
        if (card.id === activeCardId) return { ...card, expenses: [] };
        return card;
      }));
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header & Tabs */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Receipt size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Expensy</h1>
            </div>
            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
              <span>Sincronizado</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <nav className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => setActiveCardId(card.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeCardId === card.id 
                    ? `border-indigo-600 text-indigo-600` 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${card.color}`}></div>
                <span>{card.name} (****{card.lastFourDigits})</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total da Fatura</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-sm text-gray-500 mt-1">{activeCard.expenses.length} transações</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reconciliado</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.reconciledAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-700" 
                style={{ width: `${stats.completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">A Reconciliar</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {stats.pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-sm text-gray-500 mt-1">Faltam {activeCard.expenses.filter(e => !e.receiptAttached).length} comprovantes</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <label className="flex-1 group cursor-pointer">
            <div className="flex items-center justify-center space-x-3 px-6 py-4 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all font-medium">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload size={20} />
              )}
              <span>{isProcessing ? "Processando Extrato..." : "Anexar Extrato (Imagem/PDF)"}</span>
            </div>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isProcessing} />
          </label>
          
          <button 
            onClick={() => setShowManualInput(true)}
            className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Inserir Texto Manual</span>
          </button>

          {activeCard.expenses.length > 0 && (
            <button 
              onClick={clearAllExpenses}
              className="px-4 py-4 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center"
              title="Limpar cartão"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Manual Input Modal */}
        {showManualInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Importar do Texto</h3>
                <button onClick={() => setShowManualInput(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">Cole o texto do seu aplicativo bancário ou fatura. Nossa IA extrairá os valores automaticamente.</p>
                <textarea 
                  className="w-full h-48 p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
                  placeholder="Ex: 12/04 Supermercado R$ 150,00..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </div>
              <div className="p-6 bg-gray-50 flex space-x-3">
                <button 
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 py-3 px-4 border rounded-xl text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleManualImport}
                  disabled={isProcessing || !manualText.trim()}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {isProcessing ? "Processando..." : "Importar Agora"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Extrato de Despesas</h2>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Ok</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>Pendente</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {activeCard.expenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhuma despesa lançada</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-1">Carregue um arquivo de extrato ou insira manualmente para começar a organizar.</p>
              </div>
            ) : (
              activeCard.expenses.map((expense) => (
                <div key={expense.id} className="group hover:bg-gray-50/80 transition-all flex items-center p-4 sm:p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors ${
                    expense.receiptAttached ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600'
                  }`}>
                    {expense.receiptAttached ? <CheckCircle size={22} /> : <Receipt size={22} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-semibold text-gray-900 truncate ${expense.receiptAttached ? 'line-through text-gray-400' : ''}`}>
                        {expense.description}
                      </h4>
                      {expense.category && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium hidden sm:block">
                          {expense.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{expense.date}</p>
                  </div>

                  <div className="text-right mr-4 sm:mr-8">
                    <div className={`font-bold text-lg ${expense.receiptAttached ? 'text-gray-400' : 'text-gray-900'}`}>
                      {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleReceipt(expense.id)}
                      className={`p-2 rounded-lg transition-all ${
                        expense.receiptAttached 
                          ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                      }`}
                      title={expense.receiptAttached ? "Remover Comprovante" : "Anexar Comprovante"}
                    >
                      {expense.receiptAttached ? <X size={20} /> : <Camera size={20} />}
                    </button>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Footer Stats for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div>
          <p className="text-xs text-gray-500 font-medium">PENDENTE</p>
          <p className="text-lg font-bold text-amber-600">
            {stats.pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="h-10 w-px bg-gray-100 mx-4"></div>
        <div className="flex-1 text-right">
          <p className="text-xs text-gray-500 font-medium">RECONCILIADO</p>
          <p className="text-lg font-bold text-green-600">
            {stats.reconciledAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
