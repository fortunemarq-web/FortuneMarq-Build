import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    Play,
    ShieldCheck,
    TrendingUp,
    Users,
    Star,
    Lock,
    ChevronDown,
    Zap,
    Target,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import LeadCaptureForm from '@/components/lp/lead-capture-form';
import clsx from 'clsx';

// Proper types for Next.js 13+ app router params
type Params = Promise<{ niche: string; city: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { niche, city } = await params;
    const formattedNiche = niche.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const formattedCity = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
        title: `The #1 Marketing System for ${formattedNiche} in ${formattedCity} | FortuneMarq`,
        description: `Scale your ${formattedNiche} business in ${formattedCity} with our exclusive performance-based marketing system.`,
    };
}

export default async function LandingPage({ params }: { params: Params }) {
    const { niche, city } = await params;

    // Data cleaning
    const formattedNiche = niche.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const formattedCity = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const benefits = [
        {
            title: "Exclusive Territory",
            desc: `Complete market dominance for your ${formattedNiche} business in ${formattedCity}. We never work with your competitors.`,
            icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />
        },
        {
            title: "Pay For Performance",
            desc: "Stop paying for 'exposure'. Our system is built to generate qualified booked appointments, not just clicks.",
            icon: <TrendingUp className="h-6 w-6 text-emerald-500" />
        },
        {
            title: "Automated Lead Engine",
            desc: "A hands-free system that captures, qualifies, and follows up with leads 24/7 using our custom CRM.",
            icon: <Zap className="h-6 w-6 text-emerald-500" />
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500 selection:text-black font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -left-[10%] -top-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute -right-[10%] bottom-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 px-6 py-6 border-b border-white/5 backdrop-blur-sm bg-[#020617]/50 sticky top-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <img src="/Logo.png" alt="FortuneMarq" className="h-8 w-auto brightness-200" />
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                        <Lock className="h-3 w-3" /> Exclusivity Active: {formattedCity}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Context & Headline */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Direct Performance Marketing for {formattedNiche}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                            The #1 Marketing System for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                                {formattedNiche}
                            </span> in <span className="underline decoration-emerald-500/30">{formattedCity}</span>
                        </h1>

                        <p className="text-xl text-[#64748b] leading-relaxed max-w-lg">
                            Stop wasting money on agencies that promise "branding". We build automated systems that generate high-intent patients and clients on demand.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-8 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 w-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex text-emerald-500">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Trusted by 450+ Owners</p>
                                </div>
                            </div>
                        </div>

                        {/* VSL Placeholder */}
                        <div className="relative group aspect-video w-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative z-20 w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xl shadow-emerald-500/20">
                                    <Play className="h-8 w-8 text-black fill-current translate-x-0.5" />
                                </div>
                                <img
                                    src={`https://images.unsplash.com/photo-1551288049-bbbda546697a?q=80&w=2070&auto=format&fit=crop`}
                                    alt="VSL Background"
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity grayscale"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-sm font-bold opacity-80 uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-emerald-500" /> Watch the 2-minute system walkthrough
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Lead Capture Form */}
                    <div className="lg:sticky lg:top-32 self-start animate-in slide-in-from-right-10 duration-700">
                        <LeadCaptureForm niche={formattedNiche} city={formattedCity} />

                        {/* Status Widget */}
                        <div className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-500">Exclusivity Status:</span>
                                <span>1 Slot Remaining</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                                {formattedCity}, IN
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <section className="mt-40 grid md:grid-cols-3 gap-8">
                    {benefits.map((b, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {b.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                        </div>
                    ))}
                </section>

                {/* Proof / Case Study Integration */}
                <section className="mt-40 text-center space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold">Proven ROI for {formattedNiche}s</h2>
                        <p className="text-[#64748b] text-lg max-w-2xl mx-auto">
                            We don't just talk. We have helped businesses across India scale with our "Niche Dominance" framework.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Case Study 1 */}
                        <div className="bg-white/5 border border-white/10 p-1 rounded-3xl overflow-hidden group">
                            <div className="aspect-video bg-slate-800 relative">
                                <img
                                    src="https://images.unsplash.com/photo-1606857521015-7f9fdf423740?q=80&w=2070&auto=format&fit=crop"
                                    alt="Result"
                                    className="w-full h-full object-cover opacity-50 transition-transform group-hover:scale-105 duration-700"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end p-8 text-left bg-gradient-to-t from-[#020617] via-transparent to-transparent">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                                        <TrendingUp className="h-4 w-4" /> 4.2x ROAS
                                    </div>
                                    <h4 className="text-2xl font-bold">128 New Appointments in Month 1</h4>
                                    <p className="text-slate-400 text-xs mt-1 italic">Case Study: Apollo Dental Clinic (Sample)</p>
                                </div>
                            </div>
                        </div>
                        {/* Case Study 2 */}
                        <div className="bg-white/5 border border-white/10 p-1 rounded-3xl overflow-hidden group">
                            <div className="aspect-video bg-slate-800 relative">
                                <img
                                    src="https://images.unsplash.com/photo-1576091160550-2173bdb999ef?q=80&w=2070&auto=format&fit=crop"
                                    alt="Result"
                                    className="w-full h-full object-cover opacity-50 transition-transform group-hover:scale-105 duration-700"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end p-8 text-left bg-gradient-to-t from-[#020617] via-transparent to-transparent">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                                        <Users className="h-4 w-4" /> High ROI
                                    </div>
                                    <h4 className="text-2xl font-bold">Dominated Central Market Hubli</h4>
                                    <p className="text-slate-400 text-xs mt-1 italic">Case Study: Fitness One (Sample)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 bg-[#020617]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <img src="/Logo.png" alt="FortuneMarq" className="h-6 w-auto opacity-50" />
                    <p className="text-slate-600 text-xs font-medium">© 2026 FortuneMarq. All rights reserved. Registered under FM Systems Private Limited.</p>
                    <div className="flex gap-4">
                        <div className="h-8 w-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center opacity-40 grayscale"><span className="text-[10px] font-bold">GOOGLE ADS</span></div>
                        <div className="h-8 w-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center opacity-40 grayscale"><span className="text-[10px] font-bold">META ADA</span></div>
                    </div>
                </div>
            </footer>

            {/* Sticky Floating CTA for Mobile */}
            <div className="lg:hidden fixed bottom-6 inset-x-6 z-50">
                <a
                    href="#form"
                    className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl shadow-2xl shadow-emerald-500/50"
                >
                    Apply for {formattedCity} Lockout <ArrowRight className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
