import React, { useState } from 'react';
import { SparkleIcon, CheckIcon, CampaignIcon, SearchIcon, CloseIcon } from '../constants';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import SocialProof from './SocialProof';
import TestimonialCards from './TestimonialCards';
import { whopService } from '../services/whopService';

// Helper component for animated sections
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; stagger?: boolean }> = ({ children, className, stagger = false }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div
            ref={ref}
            className={`scroll-target ${isVisible ? 'is-visible' : ''} ${stagger ? 'stagger-children' : ''} ${className || ''}`}
        >
            {children}
        </div>
    );
};


// Header
const Header: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="text-2xl font-bold text-[var(--text-primary)]">Sales Flow</div>
                <nav className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
                    <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
                    <a href="#story" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Our Story</a>
                </nav>
                <button onClick={onLogin} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold px-4 py-2 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors">
                    Login
                </button>
            </div>
        </div>
    </header>
);

// Hero Section
const HeroSection: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const sectionRef = React.useRef<HTMLElement>(null);

    const handleGetStarted = () => {
        const checkoutUrl = whopService.getCheckoutUrl();
        
        if (checkoutUrl !== '#') {
            window.location.href = checkoutUrl;
        } else {
            onLogin();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    return (
        <section 
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center overflow-hidden hero-bg"
        >
            {/* Video Background */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src="/v/173656-849839042.mp4" type="video/mp4" />
            </video>
            
            {/* Dark overlay with spotlight effect */}
            <div 
                className="absolute inset-0 bg-black/80 z-10 pointer-events-none"
                style={{
                    maskImage: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
                    WebkitMaskImage: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
                }}
            ></div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/40 via-transparent to-[var(--bg-primary)]/60 z-10 pointer-events-none"></div>
            
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full bg-[var(--brand-primary)]/10 blur-[150px] z-10 pointer-events-none"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <AnimatedSection>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 drop-shadow-lg">
                        Find B2B Leads on Social Media, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]">Effortlessly.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-200 mb-10 drop-shadow-md">
                        Sales Flow scans Reddit and Discord for you, finds potential customers talking about problems you solve, and helps you engage with AI-powered, natural-sounding comments.
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <button onClick={onLogin} className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg hover:scale-105 transition-transform">
                            Get Started
                        </button>
                        <button onClick={onLogin} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white font-semibold px-8 py-3 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors">
                            Already have an account? Login
                        </button>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
};


// Feature Card
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => (
     <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] transition-all duration-300 hover:border-violet-500/50 hover:-translate-y-1" style={{ '--stagger-delay': `${delay}ms` } as React.CSSProperties}>
        <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--brand-secondary)]">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-[var(--text-secondary)]">{description}</p>
    </div>
);

// Features Section
const FeaturesSection: React.FC = () => (
    <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Never Miss a Lead Again</h2>
                    <p className="max-w-xl mx-auto text-[var(--text-secondary)] mt-4">Sales Flow automates the most tedious parts of social selling.</p>
                </div>
            </AnimatedSection>
            <AnimatedSection stagger className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<SearchIcon className="w-6 h-6" />}
                    title="Targeted Lead Discovery"
                    description="Set up campaigns with keywords, negative keywords, and target communities. Our AI finds the most relevant conversations."
                    delay={0}
                />
                <FeatureCard 
                    icon={<SparkleIcon className="w-6 h-6" />}
                    title="AI-Powered Engagement"
                    description="Generate high-quality, context-aware comments in various tones. Sound human, not like a bot."
                    delay={150}
                />
                <FeatureCard 
                    icon={<CampaignIcon className="w-6 h-6" />}
                    title="Campaign Management"
                    description="Track found leads, contacted users, and high-potential posts all in one simple dashboard."
                    delay={300}
                />
            </AnimatedSection>
        </div>
    </section>
);

// Calendly Modal Component
const CalendlyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl h-[90vh] bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Book a Call With Us</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                </div>
                {/* Calendly Embed */}
                <iframe
                    src="https://calendly.com/dateflow4/30min"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    className="bg-white"
                    title="Book a call"
                />
            </div>
        </div>
    );
};

// Pricing Section
const PricingSection: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

    return (
        <>
            <section id="pricing" className="py-20 bg-[var(--bg-secondary)]">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Get Started for Free</h2>
                            <p className="max-w-xl mx-auto text-[var(--text-secondary)] mt-4">Start using Sales Flow today - no payment required.</p>
                        </div>
                    </AnimatedSection>
                    <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <AnimatedSection stagger className="col-span-3 lg:col-span-1">
                            <div className="bg-[var(--bg-tertiary)] p-8 rounded-2xl border border-[var(--border-color)] h-full flex flex-col" style={{'--stagger-delay': '0ms'} as React.CSSProperties}>
                                <h3 className="text-2xl font-bold">Free Access</h3>
                                <p className="text-[var(--text-secondary)] mt-2 mb-6">For everyone - no payment required.</p>
                                <p className="text-4xl font-extrabold mb-6">Free<span className="text-lg font-normal text-[var(--text-secondary)]"></span></p>
                                <ul className="space-y-4 text-[var(--text-secondary)] mb-8 flex-grow">
                                    <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-[var(--success)]"/>Unlimited Campaigns</li>
                                    <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-[var(--success)]"/>50 Refreshes/mo</li>
                                    <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-[var(--success)]"/>250 AI Responses/mo</li>
                                    <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-[var(--success)]"/>Full Access</li>
                                </ul>
                                <button 
                                    onClick={onLogin} 
                                    className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Get Started
                                </button>
                            </div>
                        </AnimatedSection>
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatedSection>
                                <div className="bg-[var(--bg-tertiary)] p-6 rounded-2xl border border-[var(--border-color)] text-center" style={{'--stagger-delay': '150ms'} as React.CSSProperties}>
                                    <h3 className="text-xl font-bold mb-4">Need More?</h3>
                                    <p className="text-[var(--text-secondary)] mb-4">More plans with higher limits and team features are coming soon. Contact us for early access.</p>
                                    <button
                                        onClick={() => setIsCalendlyOpen(true)}
                                        className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Book a Call
                                    </button>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>
            <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
        </>
    );
};


// Our Story Section
const StorySection: React.FC = () => (
    <section id="story" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
                    <div className="prose prose-lg text-[var(--text-secondary)] mx-auto space-y-4">
                        <p>Sales Flow was born from a simple frustration: finding customers on social media is powerful, but it's a massive time sink. We spent countless hours manually searching subreddits and Discord channels, trying to find people who needed our products.</p>
                        <p>We knew there had to be a better way. So, we built Sales Flow to automate the grunt work. By leveraging the power of AI to scan, filter, and even help with the initial outreach, we've turned a multi-hour daily task into a few minutes of campaign management. Our mission is to help you connect with your future customers where they are, without losing your sanity.</p>
                    </div>
                </div>
            </AnimatedSection>
        </div>
    </section>
);


// Footer
const Footer: React.FC = () => (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-[var(--text-secondary)] text-sm">
            <p>&copy; {new Date().getFullYear()} Sales Flow. All rights reserved.</p>
        </div>
    </footer>
);


const LandingPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    return (
        <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            <Header onLogin={onLogin} />
            <main>
                <HeroSection onLogin={onLogin} />
                <FeaturesSection />
                <SocialProof />
                <TestimonialCards />
                <StorySection />
                <PricingSection onLogin={onLogin} />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;