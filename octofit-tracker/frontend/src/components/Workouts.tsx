import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Workout suggestions</h2>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
    {!loading && !error && suggestions.map((workout, index) => (
      <article className="card mb-2" key={index}><div className="card-body">
        <strong>{workout.title}</strong><p>{workout.reason}</p>
      </div></article>
    ))}
  </section>;
}
