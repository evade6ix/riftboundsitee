import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://riftboundsitee-production.up.railway.app";

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
};

type CardsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Card[];
};

function App() {
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

  // Filters (UI now, can be wired to backend later)
  const [rarityFilter, setRarityFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const limit = 20;

  // Fetch cards for main grid
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
      setError("Failed to load cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCards(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced suggestions as user types
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

  const applySearch = (value: string) => {
    setActiveSearch(value);
    setShowSuggestions(false);
    fetchCards(1, value);
  };

  // NOTE: Filters are currently client-side only
  const filteredCards = cards.filter((card) => {
    if (rarityFilter && card.rarity !== rarityFilter) return false;
    if (domainFilter && card.domain !== domainFilter) return false;
    if (typeFilter && card.cardType !== typeFilter) return false;
    return true;
  });

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

  const hasFilters =
    !!rarityFilter || !!domainFilter || !!typeFilter || !!activeSearch;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top Nav / Hero */}
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 shadow-soft flex items-center justify-center">
              <span className="text-xl font-bold tracking-tight">R</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">
                Riftbound Nexus
              </span>
              <span className="text-xs text-slate-400">
                Card Intelligence for the Riftbound TCG
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition">
              Dashboard
            </button>
            <button className="rounded-full border border-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 transition">
              Pricing
            </button>
            <button className="rounded-full border border-indigo-500/60 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/20 transition">
              Sign In
            </button>
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-5">
          <div className="rounded-3xl border border-white/5 bg-gradient-to-tr from-indigo-500/10 via-sky-500/5 to-emerald-400/10 px-6 py-5 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">
                  Riftbound League of Legends TCG
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                  Search every card. Understand every deck.
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  A sleek, analytics-driven database for competitors, collectors,
                  and stores. Lightning-fast search, filters, and card insights
                  built on top of API TCG.
                </p>
              </div>
              <div className="flex gap-3 text-xs text-slate-300">
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200">
                    Cards Indexed
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {total || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-400/40 bg-sky-400/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200">
                    Page
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {page}/{totalPages || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto max-w-6xl px-4 py-6 flex gap-5">
        {/* Left sidebar: search + filters */}
        <section className="w-full max-w-xs shrink-0 space-y-5">
          {/* Search block */}
          <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Card Search
            </p>
            <h2 className="mt-1 text-sm font-semibold">
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
                  placeholder="Search by name, code…"
                  className="w-full rounded-2xl border border-slate-600/60 bg-slate-900/80 px-4 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-slate-900"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 rounded-2xl bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 transition"
                >
                  Go
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Try typing{" "}
                <span className="font-semibold text-slate-200">
                  Annie, Ahri, Jinx…
                </span>
              </p>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[92px] z-20 max-h-64 overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-soft">
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
                        className="h-10 w-7 flex-none rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">
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

          {/* Filter block */}
          <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Filters
                </p>
                <h2 className="mt-1 text-sm font-semibold">
                  Refine the card grid
                </h2>
              </div>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-slate-300 underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* Rarity */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400">Rarity</p>
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

              {/* Domain */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400">Domain</p>
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

              {/* Type */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400">Card Type</p>
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

            <p className="pt-1 text-[11px] text-slate-500">
              Filters are applied on top of the current search. More advanced
              analytics, deck views, and price overlays can plug into this
              panel later.
            </p>
          </div>
        </section>

        {/* Center: card grid */}
        <section className="flex-1 space-y-3">
          {/* Status / meta */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Card Browser
              </p>
              <p className="text-sm text-slate-300">
                Showing{" "}
                <span className="font-semibold">
                  {filteredCards.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {total}
                </span>{" "}
                cards on this page.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {activeSearch && (
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/5 px-3 py-1 text-xs text-indigo-100">
                  Search: {activeSearch}
                </span>
              )}
              {loading && (
                <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-[11px]">
                  Loading…
                </span>
              )}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {error}
            </div>
          )}

          {/* Card grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <article
                key={card._id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-soft transition hover:-translate-y-1 hover:border-indigo-400/70 hover:bg-slate-900"
              >
                {card.images?.large && (
                  <div className="relative overflow-hidden">
                    <img
                      src={card.images.large}
                      alt={card.name || card.cleanName || ""}
                      className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent opacity-90" />
                  </div>
                )}

                <div className="relative -mt-12 z-10 px-3 pb-3 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">
                      {card.name || card.cleanName}
                    </h3>
                    {card.rarity && (
                      <span className="rounded-full border border-white/15 bg-slate-950/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                        {card.rarity}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {card.set?.name || "Riftbound Set"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-200">
                    {card.domain && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">
                        {card.domain}
                      </span>
                    )}
                    {card.cardType && (
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-100">
                        {card.cardType}
                      </span>
                    )}
                    {card.energyCost && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-100">
                        Energy {card.energyCost}
                      </span>
                    )}
                    {card.might && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-100">
                        Might {card.might}
                      </span>
                    )}
                  </div>

                  <button
                    className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-indigo-500/70 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/25"
                    onClick={() =>
                      window.open(
                        `${API_BASE}/cards/${encodeURIComponent(
                          card.remoteId
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    View raw card JSON
                  </button>
                </div>
              </article>
            ))}

            {!loading && filteredCards.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 px-6 py-10 text-center text-sm text-slate-400">
                No cards match your current search or filters. Try clearing
                filters or searching for a different name.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-300">
            <div>
              Page{" "}
              <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
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
                className="rounded-full border border-indigo-500/70 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-500/25"
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
