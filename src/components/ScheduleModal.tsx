'use client';

import { useState } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export default function ScheduleModal({ isOpen, onClose, companyName }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(date);
    }
    return dates.slice(0, 5);
  };

  const timeSlots = ['10:00', '11:00', '14:00', '15:00', '16:00'];

  const formatDate = (date: Date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${m}/${d}(${days[date.getDay()]})`;
  };

  const handleConfirm = () => setIsConfirmed(true);

  const handleReset = () => {
    setSelectedDate('');
    setSelectedTime('');
    setContactName('');
    setEmail('');
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full animate-in">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">日程調整</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {!isConfirmed ? (
            <>
              <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-xs text-zinc-500">対象企業</p>
                <p className="text-sm text-blue-400 font-medium">{companyName}</p>
              </div>

              <div className="mb-4">
                <p className="section-title">日付</p>
                <div className="grid grid-cols-3 gap-2">
                  {getNextWeekDates().map((date, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(formatDate(date))}
                      className={`btn h-9 text-sm ${selectedDate === formatDate(date) ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="section-title">時間</p>
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`btn h-9 text-sm ${selectedTime === time ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <p className="section-title">担当者名</p>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="山田 太郎"
                  className="input"
                />
              </div>

              <div className="mb-4">
                <p className="section-title">メールアドレス</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yamada@example.com"
                  className="input"
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime || !contactName || !email}
                className="btn btn-primary w-full h-10"
              >
                アポイントを確定
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-4">アポイント確定</h3>

              <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 text-left text-sm space-y-1">
                <p className="text-zinc-400">企業: <span className="text-white">{companyName}</span></p>
                <p className="text-zinc-400">日時: <span className="text-green-400">{selectedDate} {selectedTime}</span></p>
                <p className="text-zinc-400">担当: <span className="text-white">{contactName}</span></p>
                <p className="text-zinc-400">Email: <span className="text-white">{email}</span></p>
              </div>

              <button onClick={handleReset} className="btn btn-ghost w-full h-10">閉じる</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
