import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { format, parse, isSameDay, isWithinInterval } from 'date-fns';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface DaySlots {
  date: Date;
  slots: TimeSlot[];
  isAllDay: boolean;
}

// 時間スロットの重複を計算して差分を取得
function subtractTimeSlots(available: TimeSlot[], busy: TimeSlot[]): TimeSlot[] {
  const result: TimeSlot[] = [];

  for (const availSlot of available) {
    let currentSlots: TimeSlot[] = [availSlot];

    for (const busySlot of busy) {
      const newSlots: TimeSlot[] = [];

      for (const slot of currentSlots) {
        // busySlotがslotと重複しない場合
        if (busySlot.end <= slot.start || busySlot.start >= slot.end) {
          newSlots.push(slot);
          continue;
        }

        // busySlotがslotを完全に含む場合
        if (busySlot.start <= slot.start && busySlot.end >= slot.end) {
          continue;
        }

        // busySlotがslotの前半と重複
        if (busySlot.start <= slot.start && busySlot.end < slot.end) {
          newSlots.push({ start: busySlot.end, end: slot.end });
          continue;
        }

        // busySlotがslotの後半と重複
        if (busySlot.start > slot.start && busySlot.end >= slot.end) {
          newSlots.push({ start: slot.start, end: busySlot.start });
          continue;
        }

        // busySlotがslotの中間にある
        if (busySlot.start > slot.start && busySlot.end < slot.end) {
          newSlots.push({ start: slot.start, end: busySlot.start });
          newSlots.push({ start: busySlot.end, end: slot.end });
          continue;
        }
      }

      currentSlots = newSlots;
    }

    result.push(...currentSlots);
  }

  return result;
}

// 日付の曜日を取得（日本語）
function getDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

// 祝日判定（簡易版 - 2025年の主要な祝日のみ）
function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // 2025年の祝日
  const holidays2025 = [
    { month: 1, day: 1 },   // 元日
    { month: 1, day: 13 },  // 成人の日
    { month: 2, day: 11 },  // 建国記念の日
    { month: 2, day: 23 },  // 天皇誕生日
    { month: 3, day: 20 },  // 春分の日
    { month: 4, day: 29 },  // 昭和の日
    { month: 5, day: 3 },   // 憲法記念日
    { month: 5, day: 4 },   // みどりの日
    { month: 5, day: 5 },   // こどもの日
    { month: 7, day: 21 },  // 海の日
    { month: 8, day: 11 },  // 山の日
    { month: 9, day: 15 },  // 敬老の日
    { month: 9, day: 23 },  // 秋分の日
    { month: 10, day: 13 }, // スポーツの日
    { month: 11, day: 3 },  // 文化の日
    { month: 11, day: 23 }, // 勤労感謝の日
  ];

  if (year === 2025) {
    return holidays2025.some(h => h.month === month && h.day === day);
  }

  return false;
}

// 結果をフォーマット
function formatResults(daySlots: DaySlots[]): string {
  const lines: string[] = [];

  for (const day of daySlots) {
    const dateStr = format(day.date, 'M/d');
    const dayOfWeek = getDayOfWeek(day.date);
    const holiday = isHoliday(day.date) ? '祝' : '';
    const dayLabel = holiday ? `${dayOfWeek}${holiday}` : dayOfWeek;

    if (day.isAllDay) {
      lines.push(`・${dateStr} (${dayLabel}) 終日`);
    } else if (day.slots.length === 0) {
      continue; // スロットがない日は出力しない
    } else {
      const timeStrs = day.slots.map(slot => {
        const startTime = format(slot.start, 'H:mm');
        const endTime = format(slot.end, 'H:mm');
        
        // 終了時刻が深夜の場合は「〜時以降」と表示
        const endHour = slot.end.getHours();
        if (endHour >= 23 || (endHour === 0 && slot.end.getMinutes() === 0)) {
          return `${startTime}以降`;
        }
        
        return `${startTime}~${endTime}`;
      });
      
      lines.push(`・${dateStr} (${dayLabel}) ${timeStrs.join('、')}`);
    }
  }

  return lines.join('\n');
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    // Google Calendar APIクライアントの設定
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 指定期間のイベントを取得
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDateTime.toISOString(),
      timeMax: endDateTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Step 1: 「アポ可能」イベントを抽出
    const availableEvents = events.filter(event => {
      const summary = event.summary || '';
      const description = event.description || '';
      return summary.includes('アポ可能') || description.includes('アポ可能');
    });

    // Step 2: NG予定（★または⚫︎を含むイベント）を抽出
    const ngEvents = events.filter(event => {
      const summary = event.summary || '';
      return summary.includes('★') || summary.includes('⚫︎') || summary.includes('●');
    });

    // 日付ごとに整理
    const dayMap = new Map<string, DaySlots>();

    // アポ可能な時間を日付ごとに分類
    for (const event of availableEvents) {
      const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;

      if (!start || !end) continue;

      const dateKey = format(start, 'yyyy-MM-dd');
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: new Date(start),
          slots: [],
          isAllDay: false,
        });
      }

      const daySlots = dayMap.get(dateKey)!;
      
      // 終日イベントかチェック（0:00-23:59 または 9:00-23:00など）
      const startHour = start.getHours();
      const endHour = end.getHours();
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 時間
      
      if (duration >= 12) {
        daySlots.isAllDay = true;
      } else {
        daySlots.slots.push({ start, end });
      }
    }

    // NG予定で時間を削る
    for (const [dateKey, daySlots] of dayMap.entries()) {
      if (daySlots.isAllDay) {
        // 終日の場合、NG予定があれば終日ではなくする
        const dateNgEvents = ngEvents.filter(event => {
          const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : null;
          if (!eventStart) return false;
          return format(eventStart, 'yyyy-MM-dd') === dateKey;
        });

        if (dateNgEvents.length > 0) {
          daySlots.isAllDay = false;
          // アポ可能イベントから時間スロットを再構築
          const availableForDay = availableEvents.filter(event => {
            const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : null;
            if (!eventStart) return false;
            return format(eventStart, 'yyyy-MM-dd') === dateKey;
          });

          daySlots.slots = availableForDay.map(event => ({
            start: new Date(event.start!.dateTime!),
            end: new Date(event.end!.dateTime!),
          }));
        }
      }

      if (!daySlots.isAllDay && daySlots.slots.length > 0) {
        const busySlots: TimeSlot[] = [];

        for (const ngEvent of ngEvents) {
          const ngStart = ngEvent.start?.dateTime ? new Date(ngEvent.start.dateTime) : null;
          const ngEnd = ngEvent.end?.dateTime ? new Date(ngEvent.end.dateTime) : null;

          if (!ngStart || !ngEnd) continue;

          // 同じ日付のNG予定のみ対象
          if (format(ngStart, 'yyyy-MM-dd') === dateKey) {
            busySlots.push({ start: ngStart, end: ngEnd });
          }
        }

        // アポ可能時間からNG時間を差し引く
        daySlots.slots = subtractTimeSlots(daySlots.slots, busySlots);
      }
    }

    // 結果を配列に変換してソート
    const resultDays = Array.from(dayMap.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // フォーマットして返す
    const formatted = formatResults(resultDays);

    return NextResponse.json({ 
      success: true, 
      formatted,
      raw: resultDays 
    });

  } catch (error) {
    console.error('Calendar extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract appointments' },
      { status: 500 }
    );
  }
}
