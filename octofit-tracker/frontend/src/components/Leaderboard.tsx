import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Leaderboard</h2>
    {loading && <p role="status">Loading leaderboard...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && leaderboard.length === 0 && <p>No leaderboard rankings found.</p>}
    {!loading && !error && leaderboard.map((entry) => (
      <article className="card mb-2" key={entry.teamName}><div className="card-body">
        <strong>{entry.rank}. {entry.teamName}</strong>: {entry.totalPoints} points
      </div></article>
    ))}
  </section>;
}
