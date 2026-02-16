'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/app/context/LangContext';
import { getGatewayUrl } from "@/lib/gateway";
import { SingleEliminationBracket, Match, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';

interface Participant {
  id: string;
  userId: string;
  registeredAt: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  winnerId: string | null;
  numberOfParticipants: number;
  createdBy: string;
  participants: Participant[];
  matches: any[];
}

export default function TournamentList() {
  const langContext = useLang();
  const lang = langContext?.lang ?? 'eng';
  const bracketTheme = useMemo(
    () =>
      createTheme({
        textColor: { main: '#F1F5F9', highlighted: '#FFFFFF', dark: '#CBD5F5' },
        matchBackground: { wonColor: '#1F2937', lostColor: '#273244' },
        score: {
          background: { wonColor: '#243044', lostColor: '#2B3648' },
          text: { highlightedWonColor: '#6EE7B7', highlightedLostColor: '#FCA5A5' },
        },
        border: { color: '#4B5563', highlightedColor: '#93C5FD' },
        roundHeader: { backgroundColor: '#1E293B', fontColor: '#F1F5F9' },
        connectorColor: '#4B5563',
        connectorColorHighlight: '#9CA3AF',
        svgBackground: '#0F172A',
      }),
    []
  );
  const bracketOptions = useMemo(
    () => ({
      style: {
        roundHeader: {
          backgroundColor: bracketTheme.roundHeader.backgroundColor,
          fontColor: bracketTheme.roundHeader.fontColor,
        },
        connectorColor: bracketTheme.connectorColor,
        connectorColorHighlight: bracketTheme.connectorColorHighlight,
      },
    }),
    [bracketTheme]
  );
  const t = useMemo(
    () =>
      lang === 'fr'
        ? {
            tournaments: 'Tournois',
            searchByName: 'Rechercher par nom',
            allStatuses: 'Tous les statuts',
            upcoming: 'À venir',
            ongoing: 'En cours',
            completed: 'Terminé',
            allAvailability: 'Toutes disponibilités',
            openSlots: 'Places disponibles',
            full: 'Complet',
            tournamentName: 'Nom du tournoi',
            addTournament: 'Ajouter un tournoi',
            creating: 'Création...',
            loading: 'Chargement des tournois...',
            noTournaments: 'Aucun tournoi disponible',
            noMatches: 'Aucun tournoi ne correspond à vos filtres',
            participants: 'Participants',
            created: 'Créé',
            winner: 'Gagnant',
            viewDetails: 'Voir les détails',
            join: 'Rejoindre',
            leave: 'Quitter',
            startTournament: 'Démarrer le tournoi',
            joinNextGame: 'Rejoindre le prochain match',
            starting: 'Démarrage...',
            joining: 'Inscription...',
            leaving: 'Désinscription...',
            deleting: 'Suppression...',
            delete: 'Supprimer',
            loadingUser: 'Chargement...',
            createdSuccess: 'Tournoi créé avec succès',
            failedFetch: 'Impossible de récupérer les tournois',
            failedCreate: 'Impossible de créer le tournoi',
            failedStart: 'Impossible de démarrer le tournoi',
            failedJoin: 'Impossible de rejoindre le tournoi',
            failedLeave: 'Impossible de quitter le tournoi',
            failedDelete: 'Impossible de supprimer le tournoi',
          }
        : {
            tournaments: 'Tournaments',
            searchByName: 'Search by name',
            allStatuses: 'All statuses',
            upcoming: 'Upcoming',
            ongoing: 'Ongoing',
            completed: 'Completed',
            allAvailability: 'All availability',
            openSlots: 'Open slots',
            full: 'Full',
            tournamentName: 'Tournament name',
            addTournament: 'Add Tournament',
            creating: 'Creating...',
            loading: 'Loading tournaments...',
            noTournaments: 'No tournaments available',
            noMatches: 'No tournaments match your filters',
            participants: 'Participants',
            created: 'Created',
            winner: 'Winner',
            viewDetails: 'View Details',
            join: 'Join',
            leave: 'Leave',
            startTournament: 'Start Tournament',
            joinNextGame: 'Join next game',
            starting: 'Starting...',
            joining: 'Joining...',
            leaving: 'Leaving...',
            deleting: 'Deleting...',
            delete: 'Delete',
            loadingUser: 'Loading...',
            createdSuccess: 'Tournament created successfully',
            failedFetch: 'Failed to fetch tournaments',
            failedCreate: 'Failed to create tournament',
            failedStart: 'Failed to start tournament',
            failedJoin: 'Failed to join tournament',
            failedLeave: 'Failed to leave tournament',
            failedDelete: 'Failed to delete tournament',
          },
    [lang]
  );
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'full'>('all');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorId, setActionErrorId] = useState<string | null>(null);
  const [matchActionLoadingId, setMatchActionLoadingId] = useState<string | null>(null);
  const [matchActionError, setMatchActionError] = useState<string | null>(null);
  const [matchActionErrorId, setMatchActionErrorId] = useState<string | null>(null);
  const [bracketOpen, setBracketOpen] = useState(false);
  const [bracketMatches, setBracketMatches] = useState<any[]>([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [bracketTournamentId, setBracketTournamentId] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    numberOfParticipants: 8,
  });

  const fetchTournaments = async () => {
    try {
      const response = await fetch(getGatewayUrl("/api/v1/tournament/tournaments"), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(t.failedFetch);
      }

      const data = await response.json();
      setTournaments(data.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const convert_tree_to_array = async (tree: any, matches: any[], next_match: string | null = null) => {
    let player1 = 'TBD';
    let player2 = 'TBD';
    if (tree.playerOneId) {
      const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${tree.playerOneId}`), {
        credentials: 'include',
      });
      const data = await res.json();
      player1 = data.username;
    }
    if (tree.playerTwoId) {
      const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${tree.playerTwoId}`), {
        credentials: 'include',
      });
      const data = await res.json();
      player2 = data.username;
    }
    const match = {
      id: tree.id,
      name: `${player1} vs ${player2}`,
      nextMatchId: next_match,
      tournamentRoundText: tree.round?.toString() ?? '',
      startTime: null,
      state: 'DONE',
      participants: [
        {
          id: tree.playerOneId,
          resultText:
            !tree.winnerId
            ? null
            : tree.winnerId === tree.playerOneId
            ? 'Win'
            : tree.winnerId === tree.playerTwoId
            ? 'Loss'
            : null,
          isWinner: tree.winnerId === tree.playerOneId,
          status: null,
          name: player1,
        },
        {
          id: tree.playerTwoId,
          resultText:
            !tree.winnerId
            ? null
            : tree.winnerId === tree.playerTwoId
            ? 'Win'
            : tree.winnerId === tree.playerOneId
            ? 'Loss'
            : null,
          isWinner: tree.winnerId === tree.playerTwoId,
          status: null,
          name: player2,
        },
      ],
    };
    matches.push(match);
    if (tree.left) {
      await convert_tree_to_array(tree.left, matches, tree.id);
    }
    if (tree.right) {
      await convert_tree_to_array(tree.right, matches, tree.id);
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
        credentials: 'include',
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setCurrentUserId(data.id ?? null);
    } catch {
      setCurrentUserId(null);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCreateTournament = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);

    try {
      const response = await fetch(getGatewayUrl("/api/v1/tournament/new_tournament"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          numberOfParticipants: Number(form.numberOfParticipants),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      setCreateSuccess(t.createdSuccess);
      setForm({ name: '', startDate: '', endDate: '', numberOfParticipants: 8 });
      await fetchTournaments();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreateLoading(false);
    }
  };

  const runTournamentAction = async (tournamentId: string, action: string, errorMessage: string) => {
    setActionLoadingId(tournamentId);
    setActionError(null);
    setActionErrorId(null);
    try {
      const response = await fetch(
        getGatewayUrl(`/api/v1/tournament/${action}/${tournamentId}`),
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error(errorMessage);
      }
      await fetchTournaments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
      setActionErrorId(tournamentId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartTournament = (tournamentId: string) =>
    runTournamentAction(tournamentId, 'start_tournament', t.failedStart);

  const handleJoinTournament = (tournamentId: string) =>
    runTournamentAction(tournamentId, 'join_tournament', t.failedJoin);

  const handleLeaveTournament = (tournamentId: string) =>
    runTournamentAction(tournamentId, 'leave_tournament', t.failedLeave);

  const handleDeleteTournament = async (tournamentId: string) => {
    setActionLoadingId(tournamentId);
    setActionError(null);
    setActionErrorId(null);
    try {
      const response = await fetch(
        getGatewayUrl(`/api/v1/tournament/tournaments/${tournamentId}`),
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error(t.failedDelete);
      }
      await fetchTournaments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
      setActionErrorId(tournamentId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDetails = async (tournamentId: string) => {
    setBracketOpen(true);
    setBracketTournamentId(tournamentId);
    setBracketLoading(true);
    setBracketError(null);
    setBracketMatches([]);
    try {
      const response = await fetch(
        getGatewayUrl(`/api/v1/tournament/tournaments/${tournamentId}/bracket`),
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch bracket');
      }
      const tree = await response.json();
      const matches: any[] = [];
      await convert_tree_to_array(tree, matches, null);
      setBracketMatches(matches);
    } catch (err) {
      setBracketError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBracketLoading(false);
    }
  };

  const getNextPlayableMatch = (tournament: Tournament, userId: string | null) => {
    if (!userId) {
      return null;
    }
    return (
      tournament.matches.find(
        (match) =>
          match.status !== 'completed' &&
          (match.playerOneId === userId || match.playerTwoId === userId)
      ) ?? null
    );
  };

  const isMatchReady = (match: any) => Boolean(match?.playerOneId && match?.playerTwoId);

  const handleJoinNextGame = async (tournamentId: string, matchId: string) => {
    setMatchActionLoadingId(matchId);
    setMatchActionError(null);
    setMatchActionErrorId(null);
    try {
      const response = await fetch(
        getGatewayUrl(`/api/v1/tournament/matches/${matchId}/start`),
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to start match');
      }
      const data = await response.json();
      if (!data?.gameMatchId) {
        throw new Error('Failed to start match');
      }
      window.location.assign(
        `/game2d?tournamentId=${tournamentId}&roomId=${data.gameMatchId}&privatee=true`
      );
    } catch (err) {
      setMatchActionError(err instanceof Error ? err.message : 'An error occurred');
      setMatchActionErrorId(matchId);
    } finally {
      setMatchActionLoadingId(null);
    }
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    const isOpen = tournament.participants.length < tournament.numberOfParticipants;
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'open' && isOpen) ||
      (availabilityFilter === 'full' && !isOpen);

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  return (
    <div className="container mx-auto py-8 px-2 max-w-[1350px]">
      <div className="flex flex-col gap-6 mb-8">
        <h1 className="text-3xl font-bold text-white">{t.tournaments}</h1>

        <form
          onSubmit={handleCreateTournament}
          className="rounded-lg border border-gray-500 bg-black/20 p-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder={t.tournamentName}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-400"
              required
            />
            <select
              value={form.numberOfParticipants}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, numberOfParticipants: Number(event.target.value) }))
              }
              className="w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 text-sm text-white"
              required
            >
              {[2, 4, 8, 16, 32, 64].map((value) => (
                <option className="text-black" key={value} value={value}>
                  {value} participants
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={createLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors min-w-[200px]"
            >
              {createLoading ? t.creating : t.addTournament}
            </button>
          </div>

          <div className={createError || createSuccess ? 'mt-3' : 'mt-0'}>
            {createError && <span className="text-sm text-red-400">{createError}</span>}
            {createSuccess && <span className="text-sm text-green-400">{createSuccess}</span>}
          </div>
        </form>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder={t.searchByName}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-400"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 text-sm text-white"
          >
            <option value="all" className='text-black'>{t.allStatuses}</option>
            <option value="upcoming" className='text-black'>{t.upcoming}</option>
            <option value="ongoing" className='text-black'>{t.ongoing}</option>
            <option value="completed" className='text-black'>{t.completed}</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)}
            className="w-full rounded-md border border-gray-500 bg-transparent px-2 py-2 text-sm text-white"
          >
            <option value="all" className='text-black'>{t.allAvailability}</option>
            <option value="open" className='text-black'>{t.openSlots}</option>
            <option value="full" className='text-black'>{t.full}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-lg text-gray-300">{t.loading}</div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-lg text-gray-400">{t.noTournaments}</div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-lg text-gray-400">{t.noMatches}</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-white">
          {filteredTournaments.map((tournament) => {
            const isCreator = currentUserId ? tournament.createdBy === currentUserId : false;
            const isParticipant = currentUserId
              ? tournament.participants.some((participant) => participant.userId === currentUserId)
              : false;
            const isFull = tournament.participants.length >= tournament.numberOfParticipants;
            const isActionLoading = actionLoadingId === tournament.id;
            const nextMatch = getNextPlayableMatch(tournament, currentUserId);
            const isNextMatchReady = isMatchReady(nextMatch);
            const isMatchActionLoading = nextMatch ? matchActionLoadingId === nextMatch.id : false;

            return (
              <div
                key={tournament.id}
                className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-semibold">{tournament.name}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tournament.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : tournament.status === 'ongoing'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tournament.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.participants}:</span>
                    <span className="font-medium">
                      {tournament.participants.length} / {tournament.numberOfParticipants}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.created}:</span>
                    <span className="font-medium">
                      {new Date(tournament.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {tournament.status === 'upcoming' ? (
                  currentUserId ? (
                    isCreator ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartTournament(tournament.id)}
                          disabled={!isFull || isActionLoading}
                          className="mt-4 flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                          {isActionLoading ? t.starting : t.startTournament}
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          disabled={isActionLoading}
                          className="mt-4 flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                          {isActionLoading ? t.deleting : t.delete}
                        </button>
                      </div>
                    ) : isParticipant ? (
                      <button
                        onClick={() => handleLeaveTournament(tournament.id)}
                        disabled={isActionLoading}
                        className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        {isActionLoading ? t.leaving : t.leave}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinTournament(tournament.id)}
                        disabled={isActionLoading}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        {isActionLoading ? t.joining : t.join}
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="mt-4 w-full bg-gray-600 text-white font-medium py-2 px-4 rounded opacity-60"
                    >
                      {t.loadingUser}
                    </button>
                  )
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleViewDetails(tournament.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        {t.viewDetails}
                      </button>
                      {nextMatch && (
                        <button
                          onClick={() => handleJoinNextGame(tournament.id, nextMatch.id)}
                          disabled={!isNextMatchReady || isMatchActionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                          {isMatchActionLoading ? t.starting : t.joinNextGame}
                        </button>
                      )}
                    </div>
                    {nextMatch && matchActionErrorId === nextMatch.id && matchActionError && (
                      <div className="text-sm text-red-400">{matchActionError}</div>
                    )}
                  </div>
                )}
                {actionErrorId === tournament.id && actionError && (
                  <div className="mt-2 text-sm text-red-400">{actionError}</div>
                )}
              </div>
            );
          })}
      </div>
      )}
      {bracketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-6xl rounded-lg bg-black border border-gray-500 p-4">
            <button
              onClick={() => setBracketOpen(false)}
              className="absolute right-3 top-3 rounded-md bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
            >
              ✕
            </button>
            <div className="mb-3 text-lg font-semibold text-white">
              {t.viewDetails}
            </div>
            {bracketLoading ? (
              <div className="flex items-center justify-center min-h-[300px] text-gray-300">
                {t.loading}
              </div>
            ) : bracketError ? (
              <div className="flex items-center justify-center min-h-[300px] text-red-400">
                {bracketError}
              </div>
            ) : bracketMatches.length === 0 ? (
              <div className="flex items-center justify-center min-h-[300px] text-gray-300">
                {t.noMatches}
              </div>
            ) : (
              <div className="h-[70vh] w-full flex items-center justify-center overflow-auto">
                <SingleEliminationBracket
                  matches={bracketMatches}
                  matchComponent={Match}
                  theme={bracketTheme}
                  options={bracketOptions}
                  svgWrapper={({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
                    <SVGViewer
                      background={bracketTheme.svgBackground}
                      SVGBackground={bracketTheme.svgBackground}
                      width={Math.max(windowSize.width, 500)}
                      height={Math.max(windowSize.height, 500)}
                      {...props}
                    >
                      {children}
                    </SVGViewer>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
