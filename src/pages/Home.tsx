import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPostPath, getPosts, Post } from '../data/posts';
import { PostCard } from '../components/PostCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { RecommendationWizard } from '../components/RecommendationWizard';

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    getPosts().then(setPosts);
  }, []);

  const categories = Array.from(new Set(posts.map(post => post.category)));
  
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Things2buy",
    "url": window.location.origin,
    "description": "A curated shopping blog recommending must-buy items for events, travel, and anniversaries.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  if (posts.length === 0) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Things2buy - Curated Shopping Guide"
        description="Discover the best products for travel, events, and anniversaries. Expertly curated guides to help you shop smarter."
        schema={schema}
      />

      {/* Hero Section */}
      {!searchQuery && !recommendations && featuredPost && (
        <section className="mb-16 rounded-3xl bg-slate-900 text-white overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="p-8 md:p-12 lg:p-16">
              <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 mb-4 border border-indigo-500/30">
                Featured Guide
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                {featuredPost.title}
              </h1>
              <p className="text-slate-300 mb-8 text-lg line-clamp-3">
                {featuredPost.excerpt}
              </p>
              <Link 
                to={getPostPath(featuredPost)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition-transform hover:scale-105"
              >
                Read Full Guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="h-full min-h-[300px] bg-slate-800 relative">
               <img 
                 src={featuredPost.coverImage} 
                 alt={featuredPost.title}
                 className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
               />
               <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900/90 md:bg-gradient-to-r" />
            </div>
          </div>
        </section>
      )}

      {!searchQuery && !recommendations && <RecommendationWizard onSearch={setRecommendations} />}

      {/* Latest Posts */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {recommendations 
              ? '추천 결과' 
              : (searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Guides')
            }
          </h2>
          {recommendations && (
             <button onClick={() => setRecommendations(null)} className="text-indigo-600 font-semibold">
               ← 돌아가기
             </button>
          )}
          {!searchQuery && !recommendations && (
            <CategoryFilter 
              categories={categories} 
              activeCategory={activeCategory} 
              onSelect={setActiveCategory} 
            />
          )}
        </div>
        
        {recommendations ? (
          <div className="grid gap-6">
            {recommendations.map((r, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{r.name}</h3>
                  <p className="text-slate-600">{r.reason}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-indigo-600">{r.price}</div>
                  <a href={r.link} className="mt-2 inline-block rounded-full bg-slate-900 text-white px-4 py-2 font-semibold text-sm">구매하기</a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {searchQuery 
              ? `No guides found matching "${searchQuery}".`
              : 'No posts found in this category.'}
          </div>
        )}
      </section>
    </div>
  );
}
