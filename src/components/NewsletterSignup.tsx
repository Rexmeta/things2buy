import { useState } from 'react';
import { Mail } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Simulate API call
      console.log('Subscribing:', email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <div className="mt-20 rounded-3xl bg-indigo-50 p-8 md:p-12 text-center shadow-sm">
      <div className="mx-auto max-w-2xl">
        <Mail className="mx-auto h-12 w-12 text-indigo-600 mb-6" />
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Stay Inspired</h2>
        <p className="text-slate-600 mb-8 px-4">
          Get the latest shopping guides, travel recommendations, and handpicked product reviews delivered straight to your inbox.
        </p>
        
        {subscribed ? (
          <div className="rounded-lg bg-green-100 p-4 text-green-800 font-medium">
            Thanks for subscribing!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 rounded-full border-0 px-6 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
            <button
              type="submit"
              className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
