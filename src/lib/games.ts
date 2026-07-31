import { supabase } from './supabase';
import { Game, GamePlayer, GameScore, GameBet, GameStatus, TeeBox, GolfRound, GolferProfile } from '../types';
import { calculateDifferential, calculateHandicapIndex } from './whsEngine';

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
    })),
    bets: (row.bets || []).map((b: any): GameBet => ({
      id: b.id,
      gameId: b.game_id,
      createdBy: b.created_by,
      createdByName: b.creator?.name || 'Unknown Golfer',
      description: b.description,
      amount: Number(b.amount),
      status: b.status,
      winnerGolferId: b.winner_golfer_id || undefined,
      createdAt: b.created_at,
      settledAt: b.settled_at || undefined,
      participants: (b.participants || []).map((p: any) => ({
        golferId: p.golfer_id,
        golferName: p.golfer?.name || 'Unknown Golfer',
        agreed: p.agreed
      }))
    }))
  };
}

const GAME_SELECT = `*,
  players:game_players(*, golfer:golfers(name)),
  scores:game_scores(*),
  bets:game_bets(*, creator:golfers!game_bets_created_by_fkey(name), participants:game_bet_participants(*, golfer:golfers(name)))`;

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

function friendlyDbError(rawMessage: string | undefined): string {
  if (!rawMessage) return 'Something went wrong saving that. Please try again.';
  if (/relation .* does not exist/i.test(rawMessage)) {
    return "The Games feature's database tables haven't been set up yet — run the latest supabase/schema.sql in the Supabase SQL editor, then try again.";
  }
  if (/row-level security/i.test(rawMessage)) {
    return 'The database rejected that save (row-level security). Run the latest supabase/schema.sql in the Supabase SQL editor, then try again.';
  }
  return rawMessage;
}

export async function createGame(
  course: { name: string; location?: string },
  holesPlayed: 9 | 18,
  creator: { id: string; name: string },
  tee: TeeBox
): Promise<{ game: Game | null; error?: string }> {
  if (!supabase) return { game: null, error: 'Cabby is not connected to a database.' };

  try {
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

    if (gErr || !gameRow) return { game: null, error: friendlyDbError(gErr?.message) };

    const joined = await joinGame(gameRow.id, creator, tee);
    if (!joined.player) return { game: null, error: joined.error };

    const game = await fetchGame(gameRow.id);
    if (!game) return { game: null, error: 'Game was created but could not be loaded. Try refreshing.' };

    return { game };
  } catch (err: any) {
    return { game: null, error: friendlyDbError(err?.message) };
  }
}

export async function joinGame(gameId: string, golfer: { id: string; name: string }, tee: TeeBox): Promise<{ player: GamePlayer | null; error?: string }> {
  if (!supabase) return { player: null, error: 'Cabby is not connected to a database.' };

  try {
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

    if (error || !data) return { player: null, error: friendlyDbError(error?.message) };

    return {
      player: {
        id: data.id,
        gameId: data.game_id,
        golferId: data.golfer_id,
        golferName: golfer.name,
        teeName: data.tee_name,
        rating: Number(data.rating),
        slope: data.slope,
        par: data.par
      }
    };
  } catch (err: any) {
    return { player: null, error: friendlyDbError(err?.message) };
  }
}

export async function setGameStatus(gameId: string, status: GameStatus): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };
  try {
    const { error } = await supabase.from('games').update({ status }).eq('id', gameId);
    if (error) return { success: false, error: friendlyDbError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

export async function postHoleScore(gameId: string, golferId: string, hole: number, strokes: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };
  try {
    const { error } = await supabase
      .from('game_scores')
      .upsert(
        { game_id: gameId, golfer_id: golferId, hole_number: hole, strokes, updated_at: new Date().toISOString() },
        { onConflict: 'game_id,golfer_id,hole_number' }
      );
    if (error) return { success: false, error: friendlyDbError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

/**
 * Transitions a game from 'live' to 'completed', gated on it still being 'live' at
 * the moment of the write (the .eq('status', 'live') below). If two clients — or
 * one client double-clicking through a race window — both try to crown a winner,
 * only the first succeeds; the second gets updatedRows=0 back and a clear "already
 * completed" error instead of double-posting rounds and double-counting a win.
 */
export async function completeGame(gameId: string, winnerGolferId: string, winnerCurrentWins: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };

  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status: 'completed', winner_golfer_id: winnerGolferId, completed_at: new Date().toISOString() })
      .eq('id', gameId)
      .eq('status', 'live')
      .select();

    if (error) return { success: false, error: friendlyDbError(error.message) };
    if (!data || data.length === 0) return { success: false, error: 'This game was already completed.' };

    const { error: winErr } = await supabase.from('golfers').update({ games_won: winnerCurrentWins + 1 }).eq('id', winnerGolferId);
    if (winErr) return { success: false, error: friendlyDbError(winErr.message) };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

/**
 * Deletes a game entirely (game_players/game_scores cascade via the FK).
 * NOTE: does not un-post or roll back any rounds/win counts that were already
 * posted from a completed game — those stand as real logged rounds even if
 * the game card itself is removed from history.
 */
export interface GameDeletionRollback {
  removedRoundIds: string[];
  removedActivityIds: string[];
  updatedGolfers: (Partial<GolferProfile> & { id: string })[];
}

/**
 * Deletes a game and fully undoes everything it caused: cascade-removes its
 * rounds/activity posts (via the game_id FK), then recomputes every affected
 * golfer's total rounds, best gross, best differential, and Handicap Index
 * from what's actually left — not a blind "subtract one round" patch, since
 * WHS uses your best-8-of-20 rounds, not a simple running average. Also
 * decrements the winner's games_won if the game had been completed.
 */
export async function deleteGame(game: Game): Promise<{ success: boolean; error?: string; rollback?: GameDeletionRollback }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };

  try {
    // Snapshot what this game caused before it's gone, so we know what to undo.
    const { data: relatedRounds } = await supabase.from('rounds').select('id, golfer_id').eq('game_id', game.id);
    const { data: relatedActivity } = await supabase.from('activity_feed').select('id').eq('game_id', game.id);
    const affectedGolferIds = Array.from(new Set((relatedRounds || []).map((r: any) => r.golfer_id)));

    const { error: delErr } = await supabase.from('games').delete().eq('id', game.id);
    if (delErr) return { success: false, error: friendlyDbError(delErr.message) };

    const updatedGolfers: (Partial<GolferProfile> & { id: string })[] = [];

    for (const golferId of affectedGolferIds) {
      const { data: remainingRows } = await supabase.from('rounds').select('*').eq('golfer_id', golferId);

      const remaining: GolfRound[] = (remainingRows || []).map((r: any) => ({
        id: r.id,
        golferId: r.golfer_id,
        golferName: '',
        courseId: r.course_name,
        courseName: r.course_name,
        teeName: r.tee_name,
        date: r.date,
        score: r.score,
        holesPlayed: r.holes_played,
        rating: Number(r.rating),
        slope: r.slope,
        par: r.par,
        pcc: Number(r.pcc || 0),
        differential: Number(r.differential),
        notes: r.notes
      }));

      // Replay chronologically to recompute the rolling lowest index — equivalent
      // to how it's tracked incrementally elsewhere, just re-derived from scratch.
      const sorted = [...remaining].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let lowest = 54.0;
      for (let i = 1; i <= sorted.length; i++) {
        lowest = Math.min(lowest, calculateHandicapIndex(sorted.slice(0, i)).handicapIndex);
      }
      const { handicapIndex } = calculateHandicapIndex(remaining);

      const updatedFields = {
        total_rounds: remaining.length,
        best_gross_score: remaining.length ? Math.min(...remaining.map(r => r.score)) : 999,
        best_differential: remaining.length ? Math.min(...remaining.map(r => r.differential)) : 99.9,
        handicap_index: handicapIndex,
        lowest_handicap_index: lowest
      };

      await supabase.from('golfers').update(updatedFields).eq('id', golferId);

      updatedGolfers.push({
        id: golferId,
        totalRounds: updatedFields.total_rounds,
        bestGrossScore: updatedFields.best_gross_score,
        bestDifferential: updatedFields.best_differential,
        handicapIndex: updatedFields.handicap_index,
        lowestHandicapIndex: updatedFields.lowest_handicap_index
      });
    }

    if (game.status === 'completed' && game.winnerGolferId) {
      const { data: winnerRow } = await supabase.from('golfers').select('games_won').eq('id', game.winnerGolferId).single();
      if (winnerRow) {
        const newWins = Math.max(0, Number(winnerRow.games_won || 0) - 1);
        await supabase.from('golfers').update({ games_won: newWins }).eq('id', game.winnerGolferId);

        const existing = updatedGolfers.find(g => g.id === game.winnerGolferId);
        if (existing) existing.gamesWon = newWins;
        else updatedGolfers.push({ id: game.winnerGolferId, gamesWon: newWins });
      }
    }

    return {
      success: true,
      rollback: {
        removedRoundIds: (relatedRounds || []).map((r: any) => r.id),
        removedActivityIds: (relatedActivity || []).map((a: any) => a.id),
        updatedGolfers
      }
    };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

/**
 * Proposes a friendly bet on a game. The proposer is auto-agreed; everyone else
 * named has to tap Agree themselves. Cabby never moves money — this is purely
 * a shared ledger for wagers settled off-app (Apple Pay, Cash App, cash, etc.).
 */
export async function proposeBet(
  gameId: string,
  creator: { id: string; name: string },
  description: string,
  amount: number,
  participantIds: string[]
): Promise<{ bet: GameBet | null; error?: string }> {
  if (!supabase) return { bet: null, error: 'Cabby is not connected to a database.' };

  try {
    const { data: betRow, error: bErr } = await supabase
      .from('game_bets')
      .insert({ game_id: gameId, created_by: creator.id, description, amount })
      .select()
      .single();

    if (bErr || !betRow) return { bet: null, error: friendlyDbError(bErr?.message) };

    const uniqueParticipantIds = Array.from(new Set([creator.id, ...participantIds]));
    const participantInserts = uniqueParticipantIds.map(golferId => ({
      bet_id: betRow.id,
      golfer_id: golferId,
      agreed: golferId === creator.id
    }));

    const { error: pErr } = await supabase.from('game_bet_participants').insert(participantInserts);
    if (pErr) {
      await supabase.from('game_bets').delete().eq('id', betRow.id);
      return { bet: null, error: friendlyDbError(pErr.message) };
    }

    return {
      bet: {
        id: betRow.id,
        gameId: betRow.game_id,
        createdBy: betRow.created_by,
        createdByName: creator.name,
        description: betRow.description,
        amount: Number(betRow.amount),
        status: betRow.status,
        createdAt: betRow.created_at,
        participants: uniqueParticipantIds.map(id => ({
          golferId: id,
          golferName: id === creator.id ? creator.name : '',
          agreed: id === creator.id
        }))
      }
    };
  } catch (err: any) {
    return { bet: null, error: friendlyDbError(err?.message) };
  }
}

export async function agreeToBet(betId: string, golferId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };
  try {
    const { error } = await supabase.from('game_bet_participants').update({ agreed: true }).eq('bet_id', betId).eq('golfer_id', golferId);
    if (error) return { success: false, error: friendlyDbError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

export async function settleBet(betId: string, winnerGolferId?: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };
  try {
    const { error } = await supabase
      .from('game_bets')
      .update({ status: 'settled', winner_golfer_id: winnerGolferId, settled_at: new Date().toISOString() })
      .eq('id', betId);
    if (error) return { success: false, error: friendlyDbError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

export async function cancelBet(betId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };
  try {
    const { error } = await supabase.from('game_bets').delete().eq('id', betId);
    if (error) return { success: false, error: friendlyDbError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyDbError(err?.message) };
  }
}

export function subscribeToGame(gameId: string, onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};

  const channel = client
    .channel(`game-${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_bets', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_bet_participants' }, onChange)
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

export interface GameRoundResult {
  round: GolfRound;
  updatedGolfer: Partial<GolferProfile> & { id: string };
}

/**
 * Posts every fully-finished player's game total as a real WHS round, so playing
 * a Game with friends feeds the same Handicap Index math as posting a round solo
 * would — otherwise Games and Rounds would silently diverge into two unrelated
 * scoring systems and the leaderboard would stop reflecting how people actually play.
 */
export async function postGameResultsAsRounds(
  game: Game,
  existingRounds: GolfRound[],
  golfers: GolferProfile[]
): Promise<GameRoundResult[]> {
  if (!supabase) return [];

  const results: GameRoundResult[] = [];

  for (const player of game.players) {
    const { total, holesCompleted } = playerProgress(game, player.golferId);
    if (holesCompleted !== game.holesPlayed) continue;

    const differential = calculateDifferential(total, player.rating, player.slope, 0, game.holesPlayed);

    const { data: inserted, error } = await supabase
      .from('rounds')
      .insert({
        golfer_id: player.golferId,
        game_id: game.id,
        course_name: game.courseName,
        tee_name: player.teeName,
        date: game.date,
        score: total,
        holes_played: game.holesPlayed,
        rating: player.rating,
        slope: player.slope,
        par: player.par,
        pcc: 0,
        differential,
        notes: `Posted automatically from a Cabby Game at ${game.courseName}`
      })
      .select()
      .single();

    if (error || !inserted) continue;

    const newRound: GolfRound = {
      id: inserted.id,
      golferId: player.golferId,
      golferName: player.golferName,
      courseId: game.courseName,
      courseName: game.courseName,
      teeName: player.teeName,
      date: game.date,
      score: total,
      holesPlayed: game.holesPlayed,
      rating: player.rating,
      slope: player.slope,
      par: player.par,
      pcc: 0,
      differential,
      notes: inserted.notes,
      verifiedCount: 1
    };

    const golfer = golfers.find(g => g.id === player.golferId);
    const golferRounds = [...existingRounds.filter(r => r.golferId === player.golferId), newRound];
    const { handicapIndex } = calculateHandicapIndex(golferRounds);

    const updatedFields = {
      total_rounds: golferRounds.length,
      best_gross_score: Math.min(golfer?.bestGrossScore ?? 999, total),
      best_differential: Math.min(golfer?.bestDifferential ?? 99.9, differential),
      handicap_index: handicapIndex,
      lowest_handicap_index: Math.min(golfer?.lowestHandicapIndex ?? 54.0, handicapIndex)
    };

    await supabase.from('golfers').update(updatedFields).eq('id', player.golferId);

    await supabase.from('activity_feed').insert({
      golfer_id: player.golferId,
      round_id: newRound.id,
      game_id: game.id,
      type: 'round_logged',
      title: `Logged ${game.holesPlayed} holes in a Game at ${game.courseName}`,
      subtitle: `Shot ${total} • Differential: ${differential}`,
      reactions: { fire: 0, golf: 0, applause: 0, trophy: 0 }
    });

    results.push({
      round: newRound,
      updatedGolfer: {
        id: player.golferId,
        totalRounds: updatedFields.total_rounds,
        bestGrossScore: updatedFields.best_gross_score,
        bestDifferential: updatedFields.best_differential,
        handicapIndex: updatedFields.handicap_index,
        lowestHandicapIndex: updatedFields.lowest_handicap_index
      }
    });
  }

  return results;
}
