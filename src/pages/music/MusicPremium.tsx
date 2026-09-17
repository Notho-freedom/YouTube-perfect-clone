import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, DownloadIcon, MonitorSmartphoneIcon, SparklesIcon, VolumeXIcon } from 'lucide-react';

const BENEFITS: Array<{icon: React.ReactNode;title: string;description: string;}> = [
{
  icon: <VolumeXIcon className="h-6 w-6" strokeWidth={1.6} />,
  title: 'Ad-free listening',
  description: 'No interruptions between songs, on any device.'
},
{
  icon: <DownloadIcon className="h-6 w-6" strokeWidth={1.6} />,
  title: 'Download and go',
  description: 'Save songs and albums to listen without a connection.'
},
{
  icon: <MonitorSmartphoneIcon className="h-6 w-6" strokeWidth={1.6} />,
  title: 'Background play',
  description: 'Keep listening while you use other apps or lock your screen.'
},
{
  icon: <SparklesIcon className="h-6 w-6" strokeWidth={1.6} />,
  title: 'Smarter mixes',
  description: 'Unlimited skips and personalised radio built from your taste.'
}];


const PLANS: Array<{
  name: string;
  price: string;
  cadence: string;
  detail: string;
  featured?: boolean;
  perks: string[];
}> = [
{
  name: 'Individual',
  price: '€10.99',
  cadence: 'per month',
  detail: '1 account • cancel anytime',
  featured: true,
  perks: ['Ad-free music', 'Downloads', 'Background play']
},
{
  name: 'Family',
  price: '€16.99',
  cadence: 'per month',
  detail: 'Up to 5 members in your household',
  perks: ['Everything in Individual', '5 accounts', 'Separate recommendations']
},
{
  name: 'Student',
  price: '€5.49',
  cadence: 'per month',
  detail: 'Verification required each year',
  perks: ['Everything in Individual', 'Eligibility checked annually']
}];


/**
 * Premium is a billing surface, and this clone has no billing. Rather than a
 * dead placeholder, it shows the real plan structure and says plainly where
 * the boundary is.
 */
export function MusicPremium() {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
          'radial-gradient(60% 50% at 50% 0%, rgba(255, 0, 51, 0.22) 0%, rgba(3, 3, 3, 0) 75%)'
        }} />
      

      <div className="relative mx-auto max-w-[1100px] px-4 py-16 sm:px-8">
        <header className="text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/60">
            Music Premium
          </p>
          <h1 className="mt-3 text-[44px] font-bold leading-[52px] text-white sm:text-[56px] sm:leading-[64px]">
            Music without the interruptions
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-6 text-white/70">
            Ad-free, offline and in the background — on every device you already listen with.
          </p>
        </header>

        <section aria-label="Benefits" className="mt-16 grid gap-10 sm:grid-cols-2">
          {BENEFITS.map((benefit) =>
          <div key={benefit.title} className="flex gap-4">
              <span className="shrink-0 text-white">{benefit.icon}</span>
              <div>
                <h2 className="text-[16px] font-medium leading-6 text-white">{benefit.title}</h2>
                <p className="mt-1 text-[14px] leading-5 text-white/60">{benefit.description}</p>
              </div>
            </div>
          )}
        </section>

        <section aria-label="Plans" className="mt-20 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) =>
          <article
            key={plan.name}
            className={`flex flex-col rounded-xl p-6 ${
            plan.featured ? 'bg-white text-black' : 'bg-white/[0.06] text-white'}`
            }>
            
              <h2 className="text-[18px] font-bold leading-6">{plan.name}</h2>
              <p className="mt-4 text-[32px] font-bold leading-10">{plan.price}</p>
              <p className={`text-[13px] leading-5 ${plan.featured ? 'text-black/60' : 'text-white/60'}`}>
                {plan.cadence}
              </p>
              <p className={`mt-1 text-[13px] leading-5 ${plan.featured ? 'text-black/60' : 'text-white/60'}`}>
                {plan.detail}
              </p>

              <ul className="mt-6 space-y-2">
                {plan.perks.map((perk) =>
              <li key={perk} className="flex items-start gap-2 text-[14px] leading-5">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                    {perk}
                  </li>
              )}
              </ul>

              <button
              type="button"
              disabled
              title="Billing is outside this clone"
              className={`mt-8 flex h-10 cursor-not-allowed items-center justify-center rounded-full text-[14px] font-medium leading-none opacity-50 ${
              plan.featured ? 'bg-black text-white' : 'border border-white/25 text-white'}`
              }>
              
                Not available here
              </button>
            </article>
          )}
        </section>

        <p className="mt-12 text-center text-[13px] leading-5 text-white/50">
          This is a clone — there is no billing behind these plans. Everything else in YouTube Music
          runs on the real API.{' '}
          <Link to="/music" className="underline transition-colors duration-150 hover:text-white">
            Back to Home
          </Link>
        </p>
      </div>
    </div>);

}