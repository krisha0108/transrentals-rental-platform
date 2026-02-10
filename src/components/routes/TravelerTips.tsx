import { Lightbulb, AlertCircle, Clock, Shield } from 'lucide-react';

interface TravelerTipsProps {
  fromCity: string;
  toCity: string;
  distance: number;
  estimatedTime?: string | null;
}

// Helper to generate route-specific tips
function generateTips(fromCity: string, toCity: string, distance: number, estimatedTime?: string | null) {
  const tips = [
    {
      icon: Clock,
      category: 'Best Time to Travel',
      tip: distance > 200
        ? `Start early morning (6-7 AM) to avoid traffic and reach ${toCity} comfortably`
        : `You can start anytime, journey takes approximately ${estimatedTime || '3-4 hours'}`,
      type: 'timing',
      color: 'blue',
    },
    {
      icon: Shield,
      category: 'Safety First',
      tip: 'All our drivers are verified, experienced, and carry valid documents. Vehicle is fully insured.',
      type: 'safety',
      color: 'green',
    },
    {
      icon: Lightbulb,
      category: 'Pro Tip',
      tip: distance > 150
        ? 'Keep snacks and water handy. Highway dhabas may have limited options.'
        : 'Light traffic expected on this route. Carry entertainment for the journey.',
      type: 'general',
      color: 'amber',
    },
  ];

  // Add distance-specific tip
  if (distance > 250) {
    tips.push({
      icon: AlertCircle,
      category: 'Long Journey',
      tip: `This is a ${distance} km journey. Take regular breaks every 2-3 hours. Driver rest stops are included.`,
      type: 'distance',
      color: 'purple',
    });
  }

  return tips;
}

export function TravelerTips({ fromCity, toCity, distance, estimatedTime }: TravelerTipsProps) {
  const tips = generateTips(fromCity, toCity, distance, estimatedTime);

  return (
    <section className="py-16 bg-white">
      <div className="container-custom max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">
          Traveler Tips for {fromCity} to {toCity}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Make your journey comfortable and hassle-free
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {tips.map((tip, index) => {
            const colorClasses = {
              blue: 'from-blue-500 to-cyan-500 bg-blue-50 border-blue-200 text-blue-900',
              green: 'from-green-500 to-emerald-500 bg-green-50 border-green-200 text-green-900',
              amber: 'from-amber-500 to-orange-500 bg-amber-50 border-amber-200 text-amber-900',
              purple: 'from-purple-500 to-pink-500 bg-purple-50 border-purple-200 text-purple-900',
            };

            const [gradientClass, ...bgClasses] = colorClasses[tip.color as keyof typeof colorClasses].split(' ');

            return (
              <div
                key={index}
                className={`${bgClasses.join(' ')} border rounded-xl p-6`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <tip.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">{tip.category}</h3>
                    <p className="text-sm leading-relaxed opacity-90">{tip.tip}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional General Tips */}
        <div className="mt-10 bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold mb-6 text-center">General Travel Guidelines</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📱', title: 'Stay Connected', desc: 'Share trip details with family/friends' },
              { icon: '🎒', title: 'Pack Light', desc: 'Carry only essentials for comfort' },
              { icon: '💳', title: 'Payment Ready', desc: 'Cash/card for tolls and emergencies' },
              { icon: '🧴', title: 'Stay Hydrated', desc: 'Carry water bottles for the journey' },
              { icon: '😷', title: 'Health First', desc: 'Carry basic medicines if needed' },
              { icon: '📞', title: '24/7 Support', desc: 'Call us anytime for assistance' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
