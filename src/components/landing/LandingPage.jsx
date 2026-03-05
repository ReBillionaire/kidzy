import { useState, useEffect } from 'react';
import { Star, Trophy, Users, Flame, Gift, BarChart3, Sparkles, Shield, ArrowRight, ChevronDown } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.05 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="min-h-dvh bg-kidzy-bg overflow-x-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-md' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className={`font-display font-bold text-xl flex items-center gap-2 ${scrolled ? 'text-kidzy-purple' : 'text-white'}`}>
            {'\u{2B50}'} Kidzy
          </div>
          <button
            onClick={onGetStarted}
            className={`font-bold px-5 py-2 rounded-xl text-sm transition-all ${
              scrolled
                ? 'bg-kidzy-purple text-white hover:bg-kidzy-purple-dark'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            Open App {'\u{2192}'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue text-white pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-15%] w-[400px] h-[400px] bg-white/5 rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-5">
            {'\u{2728}'} 100% Free {'\u{2022}'} Works on Any Device
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-5">
            Make Good Habits{' '}
            <span className="bg-gradient-to-r from-yellow-200 to-amber-300 bg-clip-text text-transparent">
              Fun
            </span>{' '}
            for Your Kids
          </h1>

          <p className="text-lg sm:text-xl opacity-90 max-w-xl mx-auto mb-8 leading-relaxed">
            Kidzy turns everyday behaviors into a rewarding game. Kids earn K$ for good habits, unlock rewards, and build streaks the whole family loves.
          </p>

          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-white text-kidzy-purple font-display font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all"
          >
            {'\u{1F680}'} Start Using Kidzy — It's Free
          </button>

          <p className="text-sm opacity-70 mt-4">Works on any device {'\u{2022}'} Quick setup {'\u{2022}'} 30 seconds to start</p>

          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold mt-4">
            <Shield size={16} /> Your data stays on your device. Always private.
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-8 animate-bounce">
          <ChevronDown size={28} className="text-white/50" />
        </div>
      </section>

      {/* Phone Mockup */}
      <div className="flex justify-center -mt-8 mb-8 px-4">
        <div className="bg-[#1a1a2e] rounded-[32px] p-3 shadow-2xl max-w-[280px] w-full" style={{ animation: 'float 3s ease-in-out infinite' }}>
          <div className="bg-kidzy-bg rounded-[26px] overflow-hidden">
            <div className="p-4 min-h-[380px]">
              <div className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white -mx-4 -mt-4 px-4 pt-5 pb-7 rounded-b-3xl text-center mb-4">
                <h3 className="font-display font-semibold text-sm">Smith Family</h3>
                <div className="text-3xl font-display font-bold mt-1">47 K$</div>
                <div className="text-[11px] opacity-80 mt-1">+12 K$ earned today</div>
              </div>

              {[
                { emoji: '\u{1F467}', name: 'Emma', streak: 5, amount: 24, bg: 'bg-purple-50' },
                { emoji: '\u{1F466}', name: 'Liam', streak: 3, amount: 23, bg: 'bg-blue-50' },
              ].map((kid, i) => (
                <div key={i} className="bg-white rounded-xl p-3 mb-2 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 ${kid.bg} rounded-full flex items-center justify-center text-lg`}>{kid.emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-xs">{kid.name}</div>
                    <div className="text-[10px] text-kidzy-gray">{'\u{1F525}'} {kid.streak} day streak</div>
                  </div>
                  <div className="bg-green-50 text-green-700 font-bold text-xs px-2 py-1 rounded-lg">{kid.amount} K$</div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg">{'\u{1F3C6}'}</div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-amber-800">Daily Challenge</div>
                  <div className="text-[10px] text-amber-600">Complete 5 tasks today!</div>
                </div>
                <div className="font-bold text-amber-800 text-xs">2/5</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" data-animate className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-kidzy-dark mb-3">Everything Your Family Needs</h2>
            <p className="text-kidzy-gray text-lg max-w-md mx-auto">Simple tools that make parenting easier and habits more fun.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Star size={24} />, bg: 'bg-green-50', color: 'text-kidzy-green', title: 'K$ Currency System', desc: 'Kids earn Kidzy Dollars for good behaviors. Pre-built categories with customizable behaviors and values.' },
              { icon: <Gift size={24} />, bg: 'bg-yellow-50', color: 'text-kidzy-yellow', title: 'Wish Lists & Dreams', desc: 'Kids save K$ for real rewards they choose. They learn patience and goal-setting naturally.' },
              { icon: <Flame size={24} />, bg: 'bg-red-50', color: 'text-red-500', title: 'Streaks & Multipliers', desc: 'Build daily streaks for consistency. Random 2x and 3x bonuses keep things exciting with confetti celebrations.' },
              { icon: <Trophy size={24} />, bg: 'bg-purple-50', color: 'text-kidzy-purple', title: 'Leaderboard & Badges', desc: 'Sibling-friendly competition with weekly rankings, improvement tracking, and 14 unlockable achievement badges.' },
              { icon: <BarChart3 size={24} />, bg: 'bg-blue-50', color: 'text-kidzy-blue', title: 'Daily Challenges', desc: 'Three fresh challenges every day with bonus K$ rewards. Keeps kids engaged and motivated.' },
              { icon: <Users size={24} />, bg: 'bg-teal-50', color: 'text-kidzy-teal', title: 'Whole Family Support', desc: 'Multiple parents, multiple kids, separate wish lists. PIN-protected with security features built in.' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl p-6 border-2 border-transparent hover:border-kidzy-purple-light hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-kidzy-dark mb-2">{feature.title}</h3>
                <p className="text-kidzy-gray text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" data-animate className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-kidzy-dark mb-3">Up and Running in 30 Seconds</h2>
            <p className="text-kidzy-gray text-lg">No downloads needed. Just open, set up, and go.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Set Up Your Family', desc: 'Enter your family name, create a PIN, and add your kids.' },
              { num: '2', title: 'Track Behaviors', desc: 'Tap to earn K$ for brushing teeth, homework, or kindness.' },
              { num: '3', title: 'Watch Habits Stick', desc: 'Kids stay motivated with streaks, badges, and leaderboards.' },
              { num: '4', title: 'Redeem Rewards', desc: 'Saved enough K$? Redeem for real-world rewards they chose.' },
            ].map((step, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-700 ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-kidzy-purple to-kidzy-blue text-white rounded-full flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-kidzy-dark mb-1">{step.title}</h3>
                <p className="text-kidzy-gray text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section id="stats" data-animate className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-10 transition-all duration-700 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-display font-bold text-3xl text-kidzy-dark mb-3">Built for Real Families</h2>
            <p className="text-kidzy-gray text-lg">Designed by parents, for parents. Simple enough for a 4-year-old.</p>
          </div>

          <div className="flex justify-center flex-wrap gap-8 sm:gap-12">
            {[
              { num: '20+', label: 'Pre-built Behaviors' },
              { num: '14', label: 'Achievement Badges' },
              { num: '3', label: 'Daily Challenges' },
              { num: '0', label: 'Data Sent to Servers' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-700 ${isVisible('stats') ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="font-display font-bold text-4xl sm:text-5xl bg-gradient-to-r from-kidzy-purple to-kidzy-blue bg-clip-text text-transparent">
                  {stat.num}
                </div>
                <div className="text-kidzy-gray text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" data-animate className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className={`bg-gradient-to-br from-kidzy-purple to-kidzy-blue rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden transition-all duration-700 ${
            isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="absolute top-[-30%] right-[-15%] w-[300px] h-[300px] bg-white/5 rounded-full" />
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3 relative">Ready to Make Good Habits Stick?</h2>
            <p className="opacity-90 mb-8 max-w-md mx-auto text-base sm:text-lg relative">
              Join families turning daily routines into rewarding adventures. Free forever, no strings attached.
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-3 bg-white text-kidzy-purple font-display font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all relative"
            >
              {'\u{2B50}'} Start Using Kidzy Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 px-4">
        <div className="font-display font-bold text-xl text-kidzy-purple mb-2">{'\u{2B50}'} Kidzy</div>
        <p className="text-kidzy-gray text-sm">Making good habits fun for families everywhere.</p>
        <p className="text-kidzy-gray text-xs mt-2">100% free {'\u{2022}'} Privacy-first {'\u{2022}'} No account required</p>
      </footer>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
