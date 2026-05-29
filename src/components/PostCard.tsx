import { Link } from 'react-router-dom';
import { Post } from '../data/posts';
import { Calendar, Tag } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md">
      <Link to={`/post/${post.id}`} className="aspect-video overflow-hidden bg-slate-100">
        <img
          src={post.coverImage}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {(post.publishedAt || post.createdAt).split('T')[0]}
          </span>
        </div>
        <Link to={`/post/${post.id}`}>
          <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Tag className="h-3 w-3" />
            {post.tags.slice(0, 2).join(', ')}
          </div>
          <Link
            to={`/post/${post.id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Read Guide →
          </Link>
        </div>
      </div>
    </article>
  );
}
