'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { format, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

interface TimeSlot {
  date: Date;
  slots: { start: string; end: string }[];
  isAllDay: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // デフォルトで今週の期間を設定
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 月曜始まり
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    setStartDate(format(weekStart, 'yyyy-MM-dd'));
    setEndDate(format(weekEnd, 'yyyy-MM-dd'));
  }, []);

  const setThisWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    setStartDate(format(weekStart, 'yyyy-MM-dd'));
    setEndDate(format(weekEnd, 'yyyy-MM-dd'));
  };

  const setNextWeek = () => {
    const today = new Date();
    const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    const nextWeekEnd = addDays(endOfWeek(today, { weekStartsOn: 1 }), 7);
    setStartDate(format(nextWeekStart, 'yyyy-MM-dd'));
    setEndDate(format(nextWeekEnd, 'yyyy-MM-dd'));
  };

  const extractAppointments = async () => {
    if (!startDate || !endDate) {
      setError('期間を指定してください');
      return;
    }

    setLoading(true);
    setError('');
    setResults('');

    try {
      const response = await fetch('/api/calendar/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('抽出に失敗しました');
      }

      const data = await response.json();
      setResults(data.formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽出中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(results);
      alert('クリップボードにコピーしました');
    } catch (err) {
      alert('コピーに失敗しました');
    }
  };

  // ログイン画面
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Googleカレンダー
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              アポ候補自動抽出
            </h2>
          </div>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Googleカレンダーから「アポ可能」な時間を自動で抽出し、<br />
            メールやチャットにそのまま貼り付けられる形式で出力します。
          </p>

          <button
            onClick={() => signIn('google')}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>

          <p className="mt-6 text-xs text-gray-500">
            カレンダーの読み取り権限のみを使用します
          </p>
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">アポ候補自動抽出</h1>
              <p className="text-sm text-gray-600 mt-1">
                ログイン中: {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* 期間指定エリア */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">期間指定</h2>
          
          {/* クイック選択ボタン */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={setThisWeek}
              className="flex-1 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-lg transition-colors"
            >
              今週
            </button>
            <button
              onClick={setNextWeek}
              className="flex-1 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-lg transition-colors"
            >
              来週
            </button>
          </div>

          {/* 日付選択 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 抽出ボタン */}
          <button
            onClick={extractAppointments}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                抽出中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                候補を抽出する
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* 結果表示エリア */}
        {results && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">抽出結果</h2>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                結果をコピーする
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {results}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
