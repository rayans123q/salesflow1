import React, { useState } from 'react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  stats: {
    leads: number;
    potential: number;
    contacted: number;
  };
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechStart Inc",
    quote: "Sales Flow helped us find 50+ qualified leads in the first week. The AI-powered comments are incredibly natural!",
    stats: { leads: 50, potential: 12, contacted: 8 }
  },
  {
    name: "Mike Chen",
    role: "Founder",
    company: "GrowthLabs",
    quote: "We went from spending 10 hours/week on Reddit to just 30 minutes. Game changer for our B2B outreach.",
    stats: { leads: 73, potential: 18, contacted: 15 }
  },
  {
    name: "Emily Rodriguez",
    role: "Sales Lead",
    company: "CloudSync",
    quote: "The relevance scoring is spot-on. We're only engaging with high-quality leads now. ROI increased by 300%!",
    stats: { leads: 92, potential: 24, contacted: 19 }
  }
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; index: number }> = ({ testimonial, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="testimonial-card-container"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      style={{ '--stagger-delay': `${index * 150}ms` } as React.CSSProperties}
    >
      <div className={`testimonial-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card - Quote */}
        <div className="card-face card-front">
          <div className="quote-mark text-4xl text-[var(--brand-primary)] mb-4">"</div>
          <p className="text-[var(--text-primary)] text-lg mb-6 leading-relaxed">
            {testimonial.quote}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-xl">
              {testimonial.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">{testimonial.name}</div>
              <div className="text-sm text-[var(--text-secondary)]">{testimonial.role} at {testimonial.company}</div>
            </div>
          </div>
        </div>

        {/* Back of card - Stats */}
        <div className="card-face card-back">
          <h4 className="text-xl font-bold text-[var(--text-primary)] mb-6">Campaign Results</h4>
          <div className="space-y-4">
            <div className="stat-item">
              <div className="text-3xl font-bold text-[var(--brand-primary)]">{testimonial.stats.leads}</div>
              <div className="text-sm text-[var(--text-secondary)]">Leads Found</div>
            </div>
            <div className="stat-item">
              <div className="text-3xl font-bold text-[var(--brand-secondary)]">{testimonial.stats.potential}</div>
              <div className="text-sm text-[var(--text-secondary)]">High Potential</div>
            </div>
            <div className="stat-item">
              <div className="text-3xl font-bold text-green-500">{testimonial.stats.contacted}</div>
              <div className="text-sm text-[var(--text-secondary)]">Contacted</div>
            </div>
          </div>
          <div className="mt-6 text-xs text-[var(--text-secondary)] italic">
            Results from first campaign
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialCards: React.FC = () => {
  return (
    <section className="py-20 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Real Results from Real Users
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            See how businesses like yours are finding qualified leads effortlessly
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>

        <style>{`
          .testimonial-card-container {
            perspective: 1000px;
            height: 320px;
            opacity: 0;
            transform: translateY(30px);
            animation: fadeInUp 0.6s ease-out forwards;
            animation-delay: var(--stagger-delay);
          }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .testimonial-card {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s;
            transform-style: preserve-3d;
            cursor: pointer;
          }

          .testimonial-card.flipped {
            transform: rotateY(180deg);
          }

          .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 1rem;
            padding: 2rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .card-front {
            z-index: 2;
          }

          .card-back {
            transform: rotateY(180deg);
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
          }

          .stat-item {
            text-align: center;
            padding: 0.75rem;
            background: var(--bg-primary);
            border-radius: 0.5rem;
            border: 1px solid var(--border-color);
          }

          .testimonial-card:hover {
            box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
          }
        `}</style>
      </div>
    </section>
  );
};

export default TestimonialCards;
