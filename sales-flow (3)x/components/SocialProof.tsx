import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useCountUp } from '../hooks/useCountUp';

interface StatItemProps {
    end: number;
    label: string;
    startCounting: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ end, label, startCounting }) => {
    const count = useCountUp(startCounting ? end : 0, 2000);

    return (
        <div className="text-center group transition-transform duration-300 hover:scale-105">
            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-sky-400 mb-2">
                {count.toLocaleString()}+
            </h3>
            <p className="text-base md:text-lg text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">{label}</p>
        </div>
    );
};

const SocialProof: React.FC = () => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5, rootMargin: '0px 0px -100px 0px' });
    const stats = [
        { end: 15730, label: 'Leads Discovered' },
        { end: 421, label: 'Campaigns Launched' },
        { end: 8, label: 'Hours Saved Weekly' },
    ];

    return (
        <section className="py-20 bg-[var(--bg-secondary)]" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {stats.map((stat, index) => (
                            <StatItem key={index} end={stat.end} label={stat.label} startCounting={isVisible} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
