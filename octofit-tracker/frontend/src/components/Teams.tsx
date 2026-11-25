import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Teams</h2>
    {loading && <p role="status">Loading teams...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
    {!loading && !error && teams.map((team, index) => (
      <article className="card mb-2" key={index}><div className="card-body">
        <strong>{team.name}</strong> - {team.members.length} member(s)
      </div></article>
    ))}
  </section>;
}
