import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://riftboundsitee-production.up.railway.app";

type Card = {
  _id: string;
  game: string;
  remoteId: string;
  name?: string;
  cleanName?: string;
  code?: string;
  rarity?: string;
  cardType?: string;
  domain?: string;
  energyCost?: string;
  powerCost?: string;
  might?: string;
  images?: {
    small?: string;
    large?: string;
  };
  set?: {
    name?: string;
  };
  tcgplayer?: {
    id?: number;
    url?: string;
  };
};

type CardsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Card[];
};

type User = {
  id: string;
  name: string;
  email: string;
};

const TOKEN_KEY = "riftbound_token";
const USER_KEY = "riftbound_user";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Load saved auth on first load
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setAuthChecking(false);
  }, []);

  // Set axios auth header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const handleAuthSuccess = (tokenValue: string, userValue: User) => {
    setToken(tokenValue);
    setUser(userValue);
    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(userValue));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-4 text-sm">
          Checking session…
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <Dashboard user={user} onLogout={handleLogout} />
  );
}

// ---------------- AUTH UI ----------------

function AuthScreen({
  onSuccess,
}: {
  onSuccess: (token: string, user: User) => void;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loading, setLoading] = useState<"login" | "register" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("login");
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      onSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || "Unable to login. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("register");
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
      onSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || "Unable to register. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:flex-row md:items-center md:justify-between">
        {/* Left: branding / pitch */}
        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Riftbound · League of Legends TCG
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in to{" "}
            <span className="text-indigo-200">Riftbound Nexus</span>
          </h1>
          <p className="text-sm text-slate-300">
            One place for your Riftbound card intelligence: search, filter, and
            analyze the full card pool. Create an account in seconds, or sign in
            to continue.
          </p>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400">
            <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Built for
              </p>
              <p className="text-xs font-semibold">Players, stores & creators</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Powered by
              </p>
              <p className="text-xs font-semibold">API TCG & MongoDB</p>
            </div>
          </div>
          {error && (
            <div className="mt-4 inline-flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              <span className="mt-[2px] text-[10px]">!</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: auth cards */}
        <div className="mt-8 grid w-full max-w-xl gap-4 md:mt-0 md:grid-cols-2">
          {/* Login */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)]"
          >
            <h2 className="text-sm font-semibold">Sign in</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Already have an account? Enter your details to continue.
            </p>

            <label className="mt-3 text-[11px] text-slate-300">
              Email
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
            </label>

            <label className="mt-3 text-[11px] text-slate-300">
              Password
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
            </label>

            <button
              type="submit"
              disabled={loading === "login"}
              className="mt-4 rounded-2xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow shadow-indigo-500/40 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loading === "login" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Register */}
          <form
            onSubmit={handleRegister}
            className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)]"
          >
            <h2 className="text-sm font-semibold">No account? Register here</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              We’ll create a secure account tied to your email.
            </p>

            <label className="mt-3 text-[11px] text-slate-300">
              Name
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
            </label>

            <label className="mt-3 text-[11px] text-slate-300">
              Email
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
            </label>

            <label className="mt-3 text-[11px] text-slate-300">
              Password
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
            </label>

            <button
              type="submit"
              disabled={loading === "register"}
              className="mt-4 rounded-2xl border border-indigo-400/70 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
            >
              {loading === "register" ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD (card browser) ----------------

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rarityFilter, setRarityFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const limit = 20;

  const fetchCards = async (pageToLoad = 1, searchQuery = activeSearch) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: pageToLoad,
        limit,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await axios.get<CardsResponse>(`${API_BASE}/cards`, {
        params,
      });

      setCards(res.data.data);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error(err);
      setError("We couldn’t load cards right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await axios.get<CardsResponse>(`${API_BASE}/cards`, {
          params: { search: search.trim(), limit: 8, page: 1 },
        });
        setSuggestions(res.data.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [search]);

  const filteredCards = cards.filter((card) => {
    if (rarityFilter && card.rarity !== rarityFilter) return false;
    if (domainFilter && card.domain !== domainFilter) return false;
    if (typeFilter && card.cardType !== typeFilter) return false;
    return true;
  });

  const hasFilters =
    !!rarityFilter || !!domainFilter || !!typeFilter || !!activeSearch;

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setActiveSearch(trimmed);
    setShowSuggestions(false);
    fetchCards(1, trimmed);
  };

  const handleSuggestionClick = (card: Card) => {
    const value = card.name || card.cleanName || card.code || "";
    setSearch(value);
    applySearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applySearch(search);
  };

  const handleClearFilters = () => {
    setRarityFilter("");
    setDomainFilter("");
    setTypeFilter("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Small top bar with user + logout */}
      <div className="border-b border-white/5 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 text-[11px] font-black text-slate-950">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Riftbound Nexus
              </span>
              <span className="text-[11px] text-slate-300">
                Signed in as <span className="font-semibold">{user.name}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Main layout */}
      <main className="mx-auto flex max-w-7xl gap-6 px-4 pb-10 pt-4 lg:pt-6">
        {/* Sidebar: search + filters */}
        <aside className="w-full max-w-xs shrink-0 space-y-5 md:sticky md:top-20 self-start">
          {/* Search module */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Card Search
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-50">
              Find a Riftbound card
            </h2>

            <form onSubmit={handleSearchSubmit} className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length) setShowSuggestions(true);
                  }}
                  placeholder="Annie, Ahri, Jinx…"
                  className="w-full rounded-2xl border border-slate-600/70 bg-slate-950/90 px-4 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-slate-950"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 rounded-2xl bg-indigo-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow shadow-indigo-500/40 hover:bg-indigo-400 transition"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-3 right-3 top-[104px] z-30 max-h-72 overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-xl">
                {loadingSuggestions && (
                  <div className="px-3 py-2 text-[11px] text-slate-400">
                    Searching…
                  </div>
                )}
                {suggestions.map((card) => (
                  <button
                    key={card._id}
                    type="button"
                    onClick={() => handleSuggestionClick(card)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-800/90 transition"
                  >
                    {card.images?.small && (
                      <img
                        src={card.images.small}
                        alt={card.name || card.cleanName || ""}
                        className="h-9 w-7 flex-none rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-50">
                        {card.name || card.cleanName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {card.code} · {card.set?.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters module */}
          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Filters
                </p>
                <h2 className="mt-1 text-sm font-semibold text-slate-50">
                  Refine the card grid
                </h2>
              </div>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-slate-300 underline-offset-2 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Rarity</label>
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
                >
                  <option value="">Any</option>
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Domain</label>
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
                >
                  <option value="">Any</option>
                  <option value="Fury">Fury</option>
                  <option value="Mind">Mind</option>
                  <option value="Resolve">Resolve</option>
                  <option value="Wealth">Wealth</option>
                  <option value="Shadow">Shadow</option>
                  <option value="Tech">Tech</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Card Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-400"
                >
                  <option value="">Any</option>
                  <option value="Champion Unit">Champion Unit</option>
                  <option value="Unit">Unit</option>
                  <option value="Spell">Spell</option>
                  <option value="Relic">Relic</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Card grid */}
        <section className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Card Browser
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Showing{" "}
                <span className="font-semibold">{filteredCards.length}</span> of{" "}
                <span className="font-semibold">{total}</span> cards on this page.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {activeSearch && (
                <span className="rounded-full border border-indigo-500/50 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                  Search: {activeSearch}
                </span>
              )}
              {hasFilters && (
                <span className="rounded-full border border-slate-600/70 bg-slate-900 px-3 py-1">
                  Filters active
                </span>
              )}
              {loading && (
                <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1">
                  Loading…
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <article
                key={card._id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-[0_18px_50px_rgba(15,23,42,0.9)] transition hover:-translate-y-1.5 hover:border-indigo-400/70 hover:bg-slate-900"
              >
                {card.images?.large && (
                  <div className="relative overflow-hidden">
                    <img
                      src={card.images.large}
                      alt={card.name || card.cleanName || ""}
                      className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent opacity-95" />
                  </div>
                )}

                <div className="relative -mt-12 z-10 space-y-3 px-3 pb-3 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold leading-tight text-slate-50 line-clamp-2">
                        {card.name || card.cleanName}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {card.set?.name || "Riftbound Set"} ·{" "}
                        <span className="font-mono text-slate-300">
                          {card.code}
                        </span>
                      </p>
                    </div>
                    {card.rarity && (
                      <span className="rounded-full border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                        {card.rarity}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-100">
                    {card.domain && (
                      <span className="rounded-full bg-indigo-500/25 px-2 py-0.5 text-[10px] text-indigo-50">
                        {card.domain}
                      </span>
                    )}
                    {card.cardType && (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-50">
                        {card.cardType}
                      </span>
                    )}
                    {card.energyCost && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-50">
                        Energy {card.energyCost}
                      </span>
                    )}
                    {card.might && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-50">
                        Might {card.might}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {!loading && filteredCards.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 px-6 py-10 text-center text-sm text-slate-400">
                No cards match your current search or filters.
                <br />
                Try clearing filters or searching for a different name or code.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-300">
            <div>
              Page{" "}
              <span className="font-semibold text-slate-50">{page}</span> of{" "}
              <span className="font-semibold text-slate-50">{totalPages}</span>
            </div>

            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => fetchCards(page - 1)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 hover:bg-white/5"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => fetchCards(page + 1)}
                className="rounded-full border border-indigo-500 bg-indigo-500/80 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-indigo-500/40 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-400"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
