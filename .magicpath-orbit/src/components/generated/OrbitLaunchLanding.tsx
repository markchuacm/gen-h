import { type FormEvent, useMemo, useState } from 'react';

const itinerary = [
  { time: '09:20', title: 'Signal briefing', detail: 'Live mission room opens with launch telemetry and partner roll call.' },
  { time: '11:00', title: 'Product reveal', detail: 'The Horizon engine is shown in motion with responsive demos.' },
  { time: '14:30', title: 'Founder salon', detail: 'A moderated Q&A about space-grade UX, reliability, and trust.' },
];

const tiers = [
  { name: 'Observer', price: '$49', note: 'Livestream seat', perks: ['Keynote access', 'Replay vault', 'Launch kit'] },
  { name: 'Flight Deck', price: '$149', note: 'Interactive pass', perks: ['Workshop rooms', 'Live critique', 'Priority Q&A'] },
  { name: 'Mission Table', price: '$399', note: 'Team bundle', perks: ['5 passes', 'Private demo', 'Partner mixer'] },
];

export const OrbitLaunchLanding = () => {
  const [activeDay, setActiveDay] = useState('Day 01');
  const [selectedTier, setSelectedTier] = useState('Flight Deck');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Reserve your seat before the next transmission window.');

  const progress = useMemo(() => {
    if (activeDay === 'Day 01') return 38;
    if (activeDay === 'Day 02') return 64;
    return 86;
  }, [activeDay]);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !trimmed.includes('@')) {
      setMessage('Enter a valid email to receive your boarding pass.');
      return;
    }

    setMessage(`Boarding pass reserved for ${trimmed}.`);
    setEmail('');
  }

  return (
    <div className="min-h-screen w-full bg-[#07080b] text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col justify-center px-4 py-5 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden border border-white/15 bg-[#0c0f14] shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0,transparent_28%,rgba(70,210,220,0.16)_52%,rgba(255,111,97,0.12)_78%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_120px)] opacity-30" />

          <div className="relative grid min-h-[720px] gap-8 p-5 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-10">
            <div className="flex flex-col justify-between gap-10">
              <nav className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-white/62">
                <span className="border border-white/15 px-3 py-2">Orbit Works</span>
                <div className="flex flex-wrap gap-2">
                  {['Manifest', 'Seats', 'Archive'].map((item) => (
                    <button
                      key={item}
                      className="border border-white/10 px-3 py-2 text-white/70 transition hover:border-[#46d2dc] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#46d2dc]"
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </nav>

              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-3 border border-[#46d2dc]/40 bg-[#46d2dc]/10 px-3 py-2 text-sm text-[#9ceef3]">
                  <span className="h-2 w-2 bg-[#ff6f61]" />
                  Live launch summit, Kuala Lumpur and online
                </div>
                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-normal text-white sm:text-6xl lg:text-7xl">
                  Product launches that feel like mission control.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                  A one-week digital event for teams turning complex technology into clear, memorable launch moments.
                </p>

                <form onSubmit={submitInvite} className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-12 flex-1 border border-white/15 bg-white px-4 text-base text-[#111318] outline-none transition placeholder:text-[#6d7480] focus:border-[#46d2dc] focus:ring-2 focus:ring-[#46d2dc]/35"
                    placeholder="work email"
                    aria-label="Work email"
                    type="email"
                  />
                  <button
                    className="min-h-12 bg-[#ff6f61] px-6 text-sm font-bold uppercase tracking-[0.16em] text-[#160f0d] transition hover:bg-[#ff8b7f] focus:outline-none focus:ring-2 focus:ring-[#46d2dc]"
                    type="submit"
                  >
                    Request pass
                  </button>
                </form>
                <p className="mt-3 min-h-6 text-sm text-[#9ceef3]" role="status">
                  {message}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {tiers.map((tier) => {
                  const active = selectedTier === tier.name;

                  return (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => setSelectedTier(tier.name)}
                      className={`text-left transition focus:outline-none focus:ring-2 focus:ring-[#46d2dc] ${
                        active ? 'bg-white text-[#101217]' : 'border border-white/12 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{tier.name}</span>
                          <span className="text-xl font-semibold">{tier.price}</span>
                        </div>
                        <p className={`mt-1 text-sm ${active ? 'text-[#59616d]' : 'text-white/55'}`}>{tier.note}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {tier.perks.map((perk) => (
                            <span
                              key={perk}
                              className={`border px-2 py-1 text-xs ${
                                active ? 'border-[#d5d9df] text-[#3e4650]' : 'border-white/12 text-white/55'
                              }`}
                            >
                              {perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="grid gap-4 lg:grid-rows-[1fr_auto]">
              <div className="relative min-h-[420px] overflow-hidden border border-white/15 bg-[#151922] p-5">
                <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(70,210,220,0.32),transparent)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/50">Launch window</p>
                      <h2 className="mt-2 text-2xl font-semibold">Horizon OS</h2>
                    </div>
                    <div className="border border-[#46d2dc]/35 px-3 py-2 text-right">
                      <p className="text-xl font-semibold text-[#9ceef3]">{progress}%</p>
                      <p className="text-xs text-white/45">synced</p>
                    </div>
                  </div>

                  <div className="my-8 grid place-items-center">
                    <div className="relative aspect-square w-full max-w-[420px]">
                      <div className="absolute inset-[6%] border border-white/18" />
                      <div className="absolute inset-[17%] border border-[#46d2dc]/40" />
                      <div className="absolute inset-[31%] border border-[#ff6f61]/45" />
                      <div className="absolute left-1/2 top-1/2 h-[46%] w-[2px] origin-bottom -translate-x-1/2 -translate-y-full rotate-[38deg] bg-[#46d2dc]" />
                      <div className="absolute left-[61%] top-[24%] h-4 w-4 bg-[#ff6f61] shadow-[0_0_28px_rgba(255,111,97,0.75)]" />
                      <div className="absolute bottom-[23%] left-[19%] h-3 w-10 bg-white" />
                      <div className="absolute inset-x-[20%] bottom-[18%] h-1 bg-[#46d2dc]" />
                      <div className="absolute inset-x-[26%] top-[18%] h-1 bg-white/55" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['Day 01', 'Day 02', 'Day 03'].map((day) => (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        type="button"
                        className={`min-h-11 border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#46d2dc] ${
                          activeDay === day
                            ? 'border-[#46d2dc] bg-[#46d2dc] text-[#071012]'
                            : 'border-white/12 text-white/62 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {itinerary.map((item) => (
                  <article key={item.time} className="border border-white/12 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-[#ff9a8f]">{item.time}</p>
                    <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.detail}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};
