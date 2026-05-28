import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost, Post } from '../../data/posts';
import { Plus, Edit, Trash2, ExternalLink, Settings as SettingsIcon } from 'lucide-react';

export function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    getPosts().then(setPosts).catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(id);
        setPosts(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        console.error(e);
        alert('Failed to delete post');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            to="/admin/settings"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </Link>
          <Link
            to="/admin/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Products</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {post.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{post.date}</td>
                  <td className="px-6 py-4 text-slate-500">{post.products.length} items</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/post/${post.id}`}
                        className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        title="View"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/edit/${post.id}`}
                        className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No posts found. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
