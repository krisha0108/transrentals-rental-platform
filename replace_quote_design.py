from pathlib import Path
path = Path('src/app/vendor/(dashboard)/bike-rentals/quotes/page.tsx')
text = path.read_text(encoding='utf-8')
start1 = text.index('/*  Quote Card Component (Grid)  */')
start2 = text.index('/*  Group Section Component  */')
end2 = text.index('/*  Loading  */')
new_block1 = '''/*  Quote Card Component (Grid)  */
  const QuoteCard = ({ quote }: { quote: Quote }) => {
    const sc = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
    const StatusIcon = sc.icon;
    const expiring = isExpiringSoon(quote.validTill) and ['SENT', 'VIEWED'].includes(quote.status);

    return (
      <div className="group rounded-[30px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden">
        <div className="grid gap-4 p-5 md:grid-cols-[140px_minmax(0,1fr)]">
          <div className="rounded-3xl bg-slate-50 p-4 flex min-h-[180px] flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold ${sc.color} border-current">
                <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
              </div>
              {expiring && <p className="text-xs font-semibold text-amber-600">Expiring soon</p>}
            </div>
            <div>
              <p className={`text-3xl font-semibold ${quote.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {quote.grandTotal.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {quote.dailyRate > 0 && `${quote.dailyRate}/day  `}
                {quote.request?.totalDays}d  {quote.status === 'ACCEPTED' ? 'Won' : `Valid ${new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} 
              </p>
            </div>
            <div className="rounded-3xl bg-white p-3 border border-slate-200 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-900">{quote.viewCount || 0}</p>
              <p>Views</p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">{quote.vehicleName}</h3>
                  {quote.vehicleBrand && <p className="text-sm text-slate-500 mt-1 truncate">{quote.vehicleBrand}</p>}
                </div>
                <span className="text-xs text-slate-400 font-mono">{quote.quoteNumber}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Client</div>
                  <div className="mt-1 truncate">{quote.request?.customerName || 'Unknown'}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Location</div>
                  <div className="mt-1 truncate">{quote.request?.locationName}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Pickup</div>
                  <div className="mt-1">{quote.request?.pickupDate && new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Drop</div>
                  <div className="mt-1">{quote.request?.dropDate && new Date(quote.request.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/vendor/bike-rentals/quotes/${quote.id}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="w-4 h-4" /> View
              </Link>

              {['SENT', 'VIEWED'].includes(quote.status) && (
                <>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hi, following up on your bike rental quote #${quote.quoteNumber} for ${quote.grandTotal.toLocaleString()}. Let me know if you have any questions!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-600"
                  >
                    <MessageCircle className="w-4 h-4" /> Follow up
                  </a>
                  <button
                    onClick={async () => {
                      if (!confirm('Withdraw this quote?')) return;
                      try {
                        const res = await fetch(`/api/vendor/bike-quotes/${quote.id}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'withdraw' }),
                        });
                        if (res.ok) fetchQuotes();
                        else { const d = await res.json(); alert(d.error || 'Failed'); }
                      } catch { alert('Failed to withdraw'); }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" /> Withdraw
                  </button>
                </>
              )}

              {quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status) && (
                <Link
                  href={`/vendor/bike-rentals/requests/${quote.request.id}/quote`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
                >
                  <RefreshCw className="w-4 h-4" /> Resend
                </Link>
              )}

              {quote.status === 'ACCEPTED' && (
                <Link
                  href={`/vendor/bike-rentals/bookings?quote=${quote.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4" /> Booking
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
'''
new_block2 = '''/*  Group Section Component  */
  const GroupSection = ({ title, icon, count, color, quotes: groupQuotes, groupKey }: {
    title: string; icon: React.ReactNode; count: number; color: string; quotes: Quote[]; groupKey: string;
  }) => {
    if (groupQuotes.length === 0) return null;
    const isCollapsed = collapsedGroups[groupKey];
    return (
      <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center justify-between w-full gap-3 mb-5 rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center h-10 w-10 rounded-3xl ${color} bg-current/10`}>{icon}</span>
            <div className="space-y-1 text-left">
              <p>{title}</p>
              <p className="text-xs text-slate-500">{count} quotes</p>
            </div>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>
        {!isCollapsed && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {groupQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        )}
      </div>
    );
  };
'''
replaced = text[:start1] + new_block1 + new_block2 + text[end2:]
path.write_text(replaced, encoding='utf-8')
print('written')
