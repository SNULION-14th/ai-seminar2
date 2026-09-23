import { useState, useMemo, useCallback } from 'react';
import type { BestSlot } from './types';
import { DAYS, HOURS } from './constants';
import { Header } from './components/Header';
import { BestSlotBanner } from './components/BestSlotBanner';
import { TimeGrid } from './components/TimeGrid';
import './App.css';

export function App() {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [mySelected, setMySelected] = useState<string[]>([]);

  // 파생 상태: 최다 득표 슬롯 계산 (득표 수가 0보다 클 때만 1개 산출)
  const bestSlot = useMemo<BestSlot | null>(() => {
    let maxCount = 0;
    let topSlot: BestSlot | null = null;

    for (const day of DAYS) {
      for (const hour of HOURS) {
        const key = `${day}-${hour}`;
        const count = votes[key] || 0;
        if (count > maxCount) {
          maxCount = count;
          topSlot = { key, day, hour, count };
        }
      }
    }

    if (maxCount > 0 && topSlot) {
      return topSlot;
    }
    return null;
  }, [votes]);

  // 슬롯 클릭 핸들러: mySelected 토글 및 votes 증감 반영
  const handleSlotClick = useCallback((slotKey: string) => {
    setMySelected((prevSelected) => {
      const isSelected = prevSelected.includes(slotKey);
      if (isSelected) {
        return prevSelected.filter((key) => key !== slotKey);
      }
      return [...prevSelected, slotKey];
    });

    setVotes((prevVotes) => {
      const isSelected = mySelected.includes(slotKey);
      const nextVotes = { ...prevVotes };
      const currentCount = nextVotes[slotKey] || 0;

      if (isSelected) {
        const nextCount = Math.max(0, currentCount - 1);
        if (nextCount === 0) {
          delete nextVotes[slotKey];
        } else {
          nextVotes[slotKey] = nextCount;
        }
      } else {
        nextVotes[slotKey] = currentCount + 1;
      }

      return nextVotes;
    });
  }, [mySelected]);

  // 전체 투표 수 계산
  const totalVotes = useMemo(() => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  }, [votes]);

  // 전체 초기화 핸들러: votes 및 mySelected 초기화
  const handleReset = useCallback(() => {
    setVotes({});
    setMySelected([]);
  }, []);

  return (
    <main className="syncstudy-app">
      <div className="syncstudy-container">
        <Header studyName="React 스터디 시간 투표" onReset={handleReset} />
        <BestSlotBanner bestSlot={bestSlot} totalVotes={totalVotes} />
        <TimeGrid
          votes={votes}
          mySelected={mySelected}
          bestSlot={bestSlot}
          onSlotClick={handleSlotClick}
        />
      </div>
    </main>
  );
}

export default App;
