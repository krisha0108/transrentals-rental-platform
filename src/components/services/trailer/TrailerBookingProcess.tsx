import React from 'react';
import { ClipboardList, Truck, FileText, CheckCircle } from 'lucide-react';

const HOW_IT_WORKS = [
  { step: 1, icon: ClipboardList, title: 'Enter Cargo & Route', description: 'Specify cargo type, weight, dimensions, pickup, and delivery location.' },
  { step: 2, icon: Truck, title: 'Select Trailer Type', description: 'Choose flatbed, lowbed, or container trailer based on your cargo.' },
  { step: 3, icon: FileText, title: 'Get Freight Quotes', description: 'Compare quotes from verified transporters, including escort charges.' },
  { step: 4, icon: CheckCircle, title: 'Confirm & Track', description: 'Pay advance to confirm. Track your shipment via GPS during transit.' },
];

export function TrailerBookingProcess() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <CheckCircle className="w-4 h-4" />
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">How to Book a Trailer</h2>
          <p className="text-gray-500">Get your heavy-duty trailer booked in 4 simple steps</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step, idx) => (
            <div key={step.step} className="relative">
              {idx < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-7 left-1/2 w-full border-t-2 border-dashed border-emerald-200" />
              )}
              <div className="group relative z-10 text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span
                    className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"
                    style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                  />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
