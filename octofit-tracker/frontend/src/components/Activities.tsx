import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Activities</h2>
    {loading && <p role="status">Loading activities...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
    {!loading && !error && activities.map((activity, index) => (
      <article className="card mb-2" key={index}><div className="card-body">
        <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
      </div></article>
    ))}
  </section>;
}
