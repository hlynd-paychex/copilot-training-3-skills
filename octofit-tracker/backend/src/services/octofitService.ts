import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const input = (_input ?? {}) as Record<string, unknown>;
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw badRequest('A valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw badRequest('Minutes must be a positive number');

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = (_input ?? {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!name) throw badRequest('Team name is required');
  if (!mascot) throw badRequest('Team mascot is required');

  const memberIds = Array.isArray(input.members) ? input.members : [];
  if (memberIds.some((id) => !isObjectId(id))) throw badRequest('Team members must contain valid user IDs');
  if (memberIds.length) {
    const count = await User.countDocuments({ _id: { $in: memberIds } });
    if (count !== memberIds.length) throw notFound('One or more team members were not found');
  }

  const team = await Team.create({ name, mascot, members: memberIds });
  if (memberIds.length) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals.map((entry, index) => ({
    teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(_userEmail: string) {
  const email = decodeURIComponent(_userEmail).trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) throw notFound('User not found');

  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = recent?.type === 'run' ? 'endurance'
    : recent?.type === 'strength' ? 'strength'
    : user.fitnessGoal;
  const workouts = await Workout.find().lean();
  const matching = workouts.find((workout) => workout.focus.toLowerCase() === String(focus).toLowerCase()) ?? workouts[0];
  if (!matching) return [];

  const reason = recent
    ? `Recommended for recent ${recent.type} activity and your ${String(focus)} goal`
    : `Recommended to support your ${String(focus)} fitness goal`;
  return [{ ...matching, reason }];
}

export { User };
