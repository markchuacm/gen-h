import { useState } from 'react';
const metrics = [{
  value: '42%',
  label: 'faster brief approval'
}, {
  value: '18k',
  label: 'assets sorted monthly'
}, {
  value: '6.4h',
  label: 'saved per launch cycle'
}];
const channels = ['Campaigns', 'Content ops', 'Influencers', 'Packaging'];
export const StudioDeskLanding = () => {
  const [channel, setChannel] = useState('Campaigns');
  const [seats, setSeats] = useState(8);
  const [newsletter, setNewsletter] = useState(true);
  const [demoState, setDemoState] = useState('Your workspace preview is ready.');
  function requestDemo() {
    setDemoState(`Demo queued for ${seats} seats in ${channel.toLowerCase()}.`);
  }
  return <div className="min-h-screen w-full bg-[#f7f2e8] text-[#1f2523]">
      <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col justify-center px-4 py-5 sm:px-6 lg:px-10">
        <section className="overflow-hidden border border-[#1f2523]/15 bg-[#fcfaf4]">
          <div className="grid min-h-[720px] lg:grid-cols-[0.92fr_1.08fr]">
            <aside className="flex flex-col justify-between gap-8 border-b border-[#1f2523]/15 bg-[#dcefd8] p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
              <nav className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center bg-[#1f2523] text-sm font-bold text-white">SD</span>
                  <span className="text-sm font-bold uppercase tracking-[0.16em]">Studio Desk</span>
                </div>
                <button type="button" onClick={() => setNewsletter(current => !current)} aria-pressed={newsletter} className="border border-[#1f2523]/20 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-[#ffcf5a] focus:outline-none focus:ring-2 focus:ring-[#2f7d6d]">
                  
                  {newsletter ? 'Weekly digest on' : 'Weekly digest off'}
                </button>
              </nav>

              <div>
                <p className="mb-5 inline-flex border border-[#2f7d6d]/35 bg-[#2f7d6d]/10 px-3 py-2 text-sm font-semibold text-[#235e53]">
                  Built for brand teams with too many moving parts
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-normal sm:text-5xl lg:text-6xl">
                  A calmer command center for creative production.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[#52605a]">
                  Plan campaigns, approve assets, and keep every stakeholder aligned without another sprawling status doc.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {metrics.map(metric => <div key={metric.label} className="border border-[#1f2523]/15 bg-white p-4">
                    <p className="text-3xl font-semibold">{metric.value}</p>
                    <p className="mt-2 text-sm leading-5 text-[#66716c]">{metric.label}</p>
                  </div>)}
              </div>
            </aside>

            <div className="grid gap-8 p-5 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {channels.map(item => <button key={item} type="button" onClick={() => setChannel(item)} className={`min-h-10 border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2f7d6d] ${channel === item ? 'border-[#1f2523] bg-[#1f2523] text-white' : 'border-[#1f2523]/15 bg-white text-[#52605a] hover:border-[#1f2523]/40 hover:text-[#1f2523]'}`}>
                    
                      {item}
                    </button>)}
                </div>
                <button type="button" onClick={requestDemo} className="min-h-10 bg-[#ffcf5a] px-5 text-sm font-bold uppercase tracking-[0.14em] transition hover:bg-[#f4bb31] focus:outline-none focus:ring-2 focus:ring-[#2f7d6d]">
                  
                  Book demo
                </button>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_0.62fr]">
                <section className="border border-[#1f2523]/15 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f2523]/10 pb-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f7d6d]">Live board</p>
                      <h2 className="mt-1 text-2xl font-semibold">{channel} launch room</h2>
                    </div>
                    <span className="border border-[#1f2523]/15 bg-[#f7f2e8] px-3 py-2 text-sm text-[#52605a]">Updated 4 min ago</span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {['Brief', 'Design', 'Legal'].map((stage, index) => <div key={stage} className="min-h-36 border border-[#1f2523]/12 bg-[#fcfaf4] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{stage}</p>
                          <span className="text-sm text-[#66716c]">{index + 3} tasks</span>
                        </div>
                        <div className="mt-5 space-y-2">
                          <div className="h-3 w-full bg-[#dcefd8]" />
                          <div className="h-3 w-4/5 bg-[#e8e0d0]" />
                          <div className="h-3 w-2/3 bg-[#b6d4e6]" />
                        </div>
                        <button type="button" onClick={() => setDemoState(`${stage} lane opened for ${channel.toLowerCase()}.`)} className="mt-5 w-full border border-[#1f2523]/15 py-2 text-sm font-semibold transition hover:bg-[#1f2523] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2f7d6d]">
                        
                          Open lane
                        </button>
                      </div>)}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                    <div className="border border-[#1f2523]/12 bg-[#2f7d6d] p-4 text-white">
                      <p className="text-sm uppercase tracking-[0.16em] text-white/70">Capacity</p>
                      <label className="mt-4 block text-sm font-semibold" htmlFor="seat-slider">
                        Team seats: {seats}
                      </label>
                      <input id="seat-slider" aria-label="Team seats" type="range" min="3" max="24" value={seats} onChange={event => setSeats(Number(event.target.value))} className="mt-4 w-full accent-[#ffcf5a]" />
                      
                    </div>
                    <div className="border border-[#1f2523]/12 bg-[#f7f2e8] p-4">
                      <p className="text-sm uppercase tracking-[0.16em] text-[#66716c]">Preview</p>
                      <p className="mt-4 min-h-12 text-lg font-semibold" role="status">
                        {demoState}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#66716c]">
                        {newsletter ? 'Weekly executive summaries will be included.' : 'Weekly summaries are paused for this preview.'}
                      </p>
                    </div>
                  </div>
                </section>

                <aside className="grid content-start gap-4">
                  {[['Assets', '1,284 approved files with clean usage rights.'], ['Feedback', 'Stakeholders leave scoped notes per deliverable.'], ['Timeline', 'Launch gates adjust as blockers are resolved.']].map(([title, detail]) => <article key={title} className="border border-[#1f2523]/15 bg-white p-5">
                      <h3 className="text-xl font-semibold">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#66716c]">{detail}</p>
                    </article>)}
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>;
};
