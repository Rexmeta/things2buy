import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPost, getPosts, Post } from '../data/posts';
import { PostCard } from '../components/PostCard';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Calendar, User, Tag, Share2, Check, Clock } from 'lucide-react';
import Markdown from 'react-markdown';
import { SEO } from '../components/SEO';

export function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [postData, allPostsData] = await Promise.all([
        id ? getPost(id) : Promise.resolve(undefined),
        getPosts()
      ]);
      setPost(postData);
      setAllPosts(allPostsData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4">
        <SEO title="Post Not Found" description="The requested guide could not be found." />
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Post not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  const relatedPosts = allPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  // Calculate reading time
  const wordsPerMinute = 200;
  const wordCount = (post.content || '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": [post.coverImage],
    "datePublished": post.date,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Things2buy",
      "logo": {
        "@type": "ImageObject",
        "url": "https://things2buy.app/logo.png" // Placeholder logo URL
      }
    },
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "about": post.products.map(product => ({
      "@type": "Product",
      "name": product.name,
      "image": product.imageUrl,
      "description": product.description,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": product.price.replace('$', ''),
        "url": product.affiliateLink,
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount
      }
    }))
  };

  return (
    <article className="bg-white pb-16">
      <SEO 
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        type="article"
        publishedTime={post.date}
        author={post.author}
        schema={schema}
      />
      {/* Header */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-slate-900">
        <img
          src={post.coverImage}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="container mx-auto relative h-full flex flex-col justify-end px-4 pb-12">
          <div className="flex justify-between items-end">
            <Link 
              to="/" 
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Guides
            </Link>
            <button 
              onClick={handleShare}
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
            >
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Share2 className="h-4 w-4" /> Share</>}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200 mb-4">
            <span className="rounded-full bg-indigo-500 px-3 py-1 font-medium text-white">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {post.date}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" /> {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {readingTime} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-4xl">
            {post.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="lead text-xl text-slate-600 font-medium mb-8">
              {post.excerpt}
            </p>
            <Markdown>{post.content}</Markdown>
            
            <div className="mt-12 border-t pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" /> Related Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Product List */}
          <aside className="space-y-8">
            <div className="sticky top-24 rounded-2xl border bg-slate-50 p-6 shadow-sm">
              <h3 className="mb-6 text-xl font-bold text-slate-900">
                Featured Products
              </h3>
              <div className="space-y-6">
                {post.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-6 rounded-lg bg-indigo-50 p-4 text-xs text-indigo-800">
                <strong>Disclosure:</strong> We may earn a commission if you click these links and make a purchase.
              </div>
            </div>
          </aside>
        </div>

        {/* Related Guides Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-20 border-t pt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Guides</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
        <NewsletterSignup />
      </div>
    </article>
  );
}
