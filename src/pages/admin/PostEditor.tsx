import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost, savePost, Post, Product } from '../../data/posts';
import { Save, Plus, Trash2, ArrowLeft, Wand2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePostContent, searchAliExpressProducts } from '../../services/aiService';
import { getAliExpressSettings } from './Settings';

const EMPTY_PRODUCT: Product = {
  id: '',
  name: '',
  price: '',
  rating: 5,
  reviewCount: 0,
  imageUrl: '',
  affiliateLink: '',
  description: ''
};

const EMPTY_POST: Post = {
  id: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Tech',
  tags: [],
  date: new Date().toISOString().split('T')[0],
  author: 'Admin',
  products: []
};

export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post>(EMPTY_POST);
  const [tagInput, setTagInput] = useState('');
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  useEffect(() => {
    if (id) {
      getPost(id).then(existingPost => {
        if (existingPost) {
          setPost(existingPost);
        }
      });
    } else {
      setPost({ ...EMPTY_POST, id: Date.now().toString() });
    }
  }, [id]);

  const handleAutoGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    try {
      // 1. Generate Content
      const generated = await generatePostContent(topic);
      
      // 2. Get Settings
      const settings = getAliExpressSettings();
      const trackingId = settings.trackingId || 'default_tracking';

      // 3. Search Products (Simulated)
      const products = await searchAliExpressProducts(generated.products, trackingId);

      // 4. Update Form
      setPost(prev => ({
        ...prev,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        category: generated.category,
        tags: generated.tags,
        coverImage: `https://source.unsplash.com/random/1200x600/?${encodeURIComponent(generated.coverImageQuery)}`,
        products: products
      }));
      
      setShowAiPrompt(false);
    } catch (error) {
      alert('Failed to generate content. Please check your API keys and try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePost(post);
    navigate('/admin');
  };

  const addProduct = () => {
    setPost({
      ...post,
      products: [...post.products, { ...EMPTY_PRODUCT, id: Date.now().toString() }]
    });
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const newProducts = [...post.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setPost({ ...post, products: newProducts });
  };

  const removeProduct = (index: number) => {
    const newProducts = post.products.filter((_, i) => i !== index);
    setPost({ ...post, products: newProducts });
  };

  const addTag = () => {
    if (tagInput.trim() && !post.tags.includes(tagInput.trim())) {
      setPost({ ...post, tags: [...post.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost({ ...post, tags: post.tags.filter(tag => tag !== tagToRemove) });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            {id ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        
        <button
          type="button"
          onClick={() => setShowAiPrompt(!showAiPrompt)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md hover:from-purple-700 hover:to-indigo-700"
        >
          <Wand2 className="h-4 w-4" /> Auto-Generate with AI
        </button>
      </div>

      {/* AI Prompt Modal/Section */}
      {showAiPrompt && (
        <div className="mb-8 rounded-xl border border-purple-100 bg-purple-50 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="mb-4 text-lg font-bold text-purple-900 flex items-center gap-2">
            <Wand2 className="h-5 w-5" /> AI Content Generator
          </h3>
          <p className="mb-4 text-sm text-purple-700">
            Enter a topic, and AI will write the article and find relevant AliExpress products automatically.
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Best camping gear for beginners, Valentine's gifts for gamers..."
              className="flex-1 rounded-lg border border-purple-200 px-4 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAutoGenerate()}
            />
            <button
              type="button"
              onClick={handleAutoGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Main Info */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                required
                value={post.title}
                onChange={e => setPost({ ...post, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Excerpt</label>
              <textarea
                required
                rows={3}
                value={post.excerpt}
                onChange={e => setPost({ ...post, excerpt: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Content (Markdown)</label>
              <textarea
                required
                rows={15}
                value={post.content}
                onChange={e => setPost({ ...post, content: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Affiliate Products</h3>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>

            <div className="space-y-6">
              {post.products.map((product, index) => (
                <div key={index} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Product Name</label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={e => updateProduct(index, 'name', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Price</label>
                      <input
                        type="text"
                        value={product.price}
                        onChange={e => updateProduct(index, 'price', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Affiliate Link</label>
                      <input
                        type="text"
                        value={product.affiliateLink}
                        onChange={e => updateProduct(index, 'affiliateLink', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Image URL</label>
                      <input
                        type="text"
                        value={product.imageUrl}
                        onChange={e => updateProduct(index, 'imageUrl', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
                      <textarea
                        rows={2}
                        value={product.description}
                        onChange={e => updateProduct(index, 'description', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Publishing</h3>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={post.category}
                  onChange={e => setPost({ ...post, category: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Travel">Travel</option>
                  <option value="Event">Event</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Tech">Tech</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cover Image URL</label>
                <input
                  type="text"
                  value={post.coverImage}
                  onChange={e => setPost({ ...post, coverImage: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {post.coverImage && (
                  <img src={post.coverImage} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover" />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-lg bg-slate-100 px-4 font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Post
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
