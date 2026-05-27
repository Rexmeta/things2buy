import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPosts, Post } from '../data/posts';
import { PostCard } from '../components/PostCard';
import { SEO } from '../components/SEO';

export function CategoryPage() {
  const { category } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    getPosts().then(setPosts);
  }, []);

  const filteredPosts = posts.filter(post => post.category === category);
  const title = `${category} Guides`;
  const description = `Explore our curated selection of must-have items for ${category?.toLowerCase()}.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": category,
          "item": window.location.href
        }
      ]
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO 
        title={title}
        description={description}
        schema={schema}
      />
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{category} Guides</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Explore our curated selection of must-have items for {category?.toLowerCase()}.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
          <p className="text-slate-500 text-lg">No guides found in this category yet.</p>
        </div>
      )}
    </div>
  );
}
