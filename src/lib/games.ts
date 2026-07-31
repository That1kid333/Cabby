import { supabase } from './supabase';
import { Game, GamePlayer, GameScore, GameStatus, TeeBox } from '../types';

function mapGame(row: any): Game {
  return {
    id: row.id,
    courseName: row.course_name,
    courseLocation: row.course_location,
    holesPlayed: row.holes_played,
    status: row.status,
    createdBy: row.created_by,
    date: row.date,
    winnerGolferId: row.winner_golfer_id || undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
    players: (row.players || []).map((p: any): GamePlayer => ({
      id: p.id,
      gameId: p.game_id,
      golferId: p.golfer_id,
      golferName: p.golfer?.name || 'Unknown Golfer',
      teeName: p.tee_name,
      rating: Number(p.rating),
      slope: p.slope,
      par: p.par
    })),
    scores: (row.scores || []).map((s: any): GameScore => ({
      golferId: s.golfer_id,
      hole: s.hole_number,
      strokes: s.strokes
    }))
  };
}

const GAME_SELECT = '*, players:game_players(*, golfer:golfers(name)), scores:game_scores(*)';

export async function fetchGames(): Promise<Game[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data.map(mapGame);
}

export async function fetchGame(gameId: string): Promise<Game | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('games').select(GAME_SELECT).eq('id', gameId).single();
  if (error || !data) return null;
  return mapGame(data);
}

export async function createGame(
  course: { name: string; location?: string },
  holesPlayed: 9 | 18,
  creator: { id: string; name: string },
  tee: TeeBox
): Promise<Game | null> {
  if (!supabase) return null;

  const { data: gameRow, error: gErr } = await supabase
    .from('games')
    .insert({
      course_name: course.name,
      course_location: course.location,
      holes_played: holesPlayed,
      status: 'lobby',
      created_by: creator.id
    })
    .select()
    .single();

  if (gErr || !gameRow) return null;

  const joined = await joinGame(gameRow.id, creator, tee);
  if (!joined) return null;

  return fetchGame(gameRow.id);
}

export async function joinGame(gameId: string, golfer: { id: string; name: string }, tee: TeeBox): Promise<GamePlayer | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('game_players')
    .insert({
      game_id: gameId,
      golfer_id: golfer.id,
      tee_name: tee.name,
      rating: tee.rating,
      slope: tee.slope,
      par: tee.par
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    gameId: data.game_id,
    golferId: data.golfer_id,
    golferName: golfer.name,
    teeName: data.tee_name,
    rating: Number(data.rating),
    slope: data.slope,
    par: data.par
  };
}

export async function setGameStatus(gameId: string, status: GameStatus): Promise<void> {
  if (!supabase) return;
  await supabase.from('games').update({ status }).eq('id', gameId);
}

export async function postHoleScore(gameId: string, golferId: string, hole: number, strokes: number): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('game_scores')
    .upsert(
      { game_id: gameId, golfer_id: golferId, hole_number: hole, strokes, updated_at: new Date().toISOString() },
      { onConflict: 'game_id,golfer_id,hole_number' }
    );
}

export async function completeGame(gameId: string, winnerGolferId: string, winnerCurrentWins: number): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('games')
    .update({ status: 'completed', winner_golfer_id: winnerGolferId, completed_at: new Date().toISOString() })
    .eq('id', gameId);

  await supabase.from('golfers').update({ games_won: winnerCurrentWins + 1 }).eq('id', winnerGolferId);
}

export function subscribeToGame(gameId: string, onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};

  const channel = client
    .channel(`game-${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/** Total strokes a player has posted so far, and how many holes they've completed. */
export function playerProgress(game: Game, golferId: string) {
  const holeScores = game.scores.filter(s => s.golferId === golferId);
  const total = holeScores.reduce((sum, s) => sum + s.strokes, 0);
  return { total, holesCompleted: holeScores.length };
}
