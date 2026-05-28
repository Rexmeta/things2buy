import { useState } from 'react';
import { Search } from 'lucide-react';

interface RecommendationWizardProps {
  onSearch: (results: any[]) => void;
}

export function RecommendationWizard({ onSearch }: RecommendationWizardProps) {
  const [who, setWho] = useState('');
  const [situation, setSituation] = useState('');
  const [budget, setBudget] = useState('');
  const [criteria, setCriteria] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate backend call for recommendations
    // In a real app, this would call /api/recommend
    console.log('Searching for:', { who, situation, budget, criteria });
    
    // Placeholder mock data
    const mockResults = [
        { name: "Product A", reason: "Good because...", price: "$50", link: "#" },
        { name: "Product B", reason: "Better for...", price: "$30", link: "#" }
    ];
    onSearch(mockResults);
  };

  return (
    <section className="my-16 p-8 rounded-3xl bg-indigo-50 shadow-sm border border-indigo-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">무엇을 사야 할지 모르겠나요?</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <select onChange={(e) => setWho(e.target.value)} className="rounded-full border-0 px-4 py-3 ring-1 ring-slate-300">
          <option value="">누구에게?</option>
          <option value="child">아이</option>
          <option value="parent">부모님</option>
        </select>
        <select onChange={(e) => setSituation(e.target.value)} className="rounded-full border-0 px-4 py-3 ring-1 ring-slate-300">
          <option value="">상황은?</option>
          <option value="birthday">생일</option>
          <option value="travel">여행</option>
        </select>
        <select onChange={(e) => setBudget(e.target.value)} className="rounded-full border-0 px-4 py-3 ring-1 ring-slate-300">
          <option value="">예산은?</option>
          <option value="10k">1만원 이하</option>
          <option value="30k">3만원</option>
        </select>
        <select onChange={(e) => setCriteria(e.target.value)} className="rounded-full border-0 px-4 py-3 ring-1 ring-slate-300">
          <option value="">중요한 기준은?</option>
          <option value="practical">실용성</option>
          <option value="luxury">고급스러움</option>
        </select>
        <button type="submit" className="md:col-span-4 lg:col-span-1 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 py-3">
          <Search size={18} /> 추천 받기
        </button>
      </form>
    </section>
  );
}
