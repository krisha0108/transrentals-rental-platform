'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  Loader2,
  Plus,
  Trash2,
  Calendar,
  Lock,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  bookingId?: string;
  bookingType?: string;
  notes?: string;
  createdBy?: string;
}

interface FleetBlockedDatesCalendarProps {
  fleetId: string;
}

export default function FleetBlockedDatesCalendar({ fleetId }: FleetBlockedDatesCalendarProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [blockNotes, setBlockNotes] = useState('');
  const [error, setError] = useState('');

  const fetchBlockedDates = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendor/fleet/${fleetId}/blocked-dates`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBlockedDates(data.blockedDates);
      }
    } catch (err) {
      console.error('Failed to fetch blocked dates:', err);
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  const handleBlockDates = async () => {
    if (!selectedRange?.from) return;

    setBlocking(true);
    setError('');

    try {
      const res = await fetch(`/api/vendor/fleet/${fleetId}/blocked-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: selectedRange.from.toISOString(),
          endDate: (selectedRange.to || selectedRange.from).toISOString(),
          notes: blockNotes || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowBlockForm(false);
        setSelectedRange(undefined);
        setBlockNotes('');
        await fetchBlockedDates();
      } else {
        setError(data.error || 'Failed to block dates');
      }
    } catch (err) {
      setError('Failed to block dates');
    } finally {
      setBlocking(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (!confirm('Remove this date block?')) return;

    try {
      const res = await fetch(
        `/api/vendor/fleet/${fleetId}/blocked-dates?blockId=${blockId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBlockedDates();
      } else {
        alert(data.error || 'Failed to remove block');
      }
    } catch (err) {
      alert('Failed to remove block');
    }
  };

  // Build modifier maps for the calendar
  const bookingDays: Date[] = [];
  const maintenanceDays: Date[] = [];

  blockedDates.forEach((bd) => {
    const start = new Date(bd.startDate);
    const end = new Date(bd.endDate);
    const current = new Date(start);

    while (current <= end) {
      const day = new Date(current);
      if (bd.reason === 'BOOKING') {
        bookingDays.push(day);
      } else {
        maintenanceDays.push(day);
      }
      current.setDate(current.getDate() + 1);
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="flex justify-center">
        <DayPicker
          mode="range"
          selected={showBlockForm ? selectedRange : undefined}
          onSelect={showBlockForm ? setSelectedRange : undefined}
          numberOfMonths={2}
          disabled={!showBlockForm ? true : undefined}
          modifiers={{
            booked: bookingDays,
            maintenance: maintenanceDays,
          }}
          modifiersClassNames={{
            booked: 'bg-red-200 text-red-800 rounded-md',
            maintenance: 'bg-gray-200 text-gray-700 rounded-md',
          }}
          style={{ margin: 0 }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          <span className="text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
          <span className="text-gray-600">Maintenance</span>
        </div>
        {showBlockForm && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
            <span className="text-gray-600">Selected</span>
          </div>
        )}
      </div>

      {/* Block dates form */}
      {showBlockForm ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Block Dates (Maintenance)
            </h4>
            <button
              onClick={() => {
                setShowBlockForm(false);
                setSelectedRange(undefined);
                setBlockNotes('');
                setError('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedRange?.from && (
            <p className="text-sm text-gray-600">
              {formatDate(selectedRange.from.toISOString())}
              {selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime()
                ? ` - ${formatDate(selectedRange.to.toISOString())}`
                : ''
              }
            </p>
          )}

          <input
            type="text"
            placeholder="Notes (optional) - e.g., Regular servicing"
            value={blockNotes}
            onChange={(e) => setBlockNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBlockDates}
              disabled={!selectedRange?.from || blocking}
            >
              {blocking ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Lock className="w-4 h-4 mr-1" />
              )}
              Block Dates
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowBlockForm(false);
                setSelectedRange(undefined);
                setBlockNotes('');
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBlockForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Block Dates
          </Button>
        </div>
      )}

      {/* Blocked dates list */}
      {blockedDates.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Blocked Periods</h4>
          {blockedDates.map((bd) => (
            <div
              key={bd.id}
              className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                bd.reason === 'BOOKING'
                  ? 'bg-red-50 border border-red-100'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {bd.reason === 'BOOKING' ? (
                  <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Wrench className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(bd.startDate)}
                    {bd.endDate !== bd.startDate &&
                      ` - ${formatDate(bd.endDate)}`}
                  </p>
                  <p className="text-gray-500">
                    {bd.reason === 'BOOKING'
                      ? `Booking${bd.bookingType ? ` (${bd.bookingType})` : ''}`
                      : bd.notes || 'Maintenance block'}
                  </p>
                </div>
              </div>

              {bd.reason !== 'BOOKING' && (
                <button
                  onClick={() => handleRemoveBlock(bd.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Remove block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
