import { useState, useEffect } from "react";
import "./CustomCalendar.css";

interface Deadline {
  date: string;
  description: string;
  priority: "high" | "medium" | "low";
  caseName: string;
  caseId: number;
  caseNumber: string;
  documentName: string;
}

interface CustomCalendarProps {
  deadlines: Deadline[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function CustomCalendar({ deadlines, onDateSelect, selectedDate }: CustomCalendarProps) {
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());

  const getMonthName = (idx: number) => {
    return ["January", "February", "March", "April", 
            "May", "June", "July", "August", "September", 
            "October", "November", "December"][idx];
  };

  const formatDate = (day: number, month: number, year: number): string => {
    const dayStr = (day.toString().length < 2) ? '0' + day : day.toString();
    const monthStr = ((month + 1).toString().length < 2) ? '0' + (month + 1) : (month + 1).toString();
    return `${dayStr}.${monthStr}.${year}`;
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const resetDate = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onDateSelect(now);
  };

  // Create calendar grid
  const date = new Date(currentYear, currentMonth, 1);
  let weekDay = (date.getDay() !== 0) ? date.getDay() : 7;

  // Get last day of month
  const lastDayDate = new Date(currentYear, currentMonth + 1, 0);
  const lastDay = lastDayDate.getDate();

  const calendar: (number | string)[] = [];
  const start = weekDay - 1;
  const end = weekDay + lastDay - 1;
  
  for (let i = 0; i < 42; ++i) {
    if (i >= start && i < end) {
      calendar[i] = i - weekDay + 2;
    } else {
      calendar[i] = '';
    }
  }

  // Check if a date has deadlines
  const hasDeadlines = (day: number): boolean => {
    const dateStr = formatDate(day, currentMonth, currentYear);
    return deadlines.some(deadline => {
      const deadlineDate = new Date(deadline.date);
      return formatDate(deadlineDate.getDate(), deadlineDate.getMonth(), deadlineDate.getFullYear()) === dateStr;
    });
  };

  // Check if a date is selected
  const isSelected = (day: number): boolean => {
    return day === selectedDate.getDate() &&
           currentMonth === selectedDate.getMonth() &&
           currentYear === selectedDate.getFullYear();
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="custom-calendar-wrapper" data-testid="custom-calendar">
      {/* Month selector */}
      <div className="calendar-month">
        <span className="month-active">
          <b>{getMonthName(currentMonth)}</b>{" " + currentYear}
        </span>
        <span className="month-selector">
          <a className="prev" href="#" onClick={(e) => { e.preventDefault(); prevMonth(); }} data-testid="button-prev-month">⟵</a>
          <a className="reset" href="#" onClick={(e) => { e.preventDefault(); resetDate(); }} data-testid="button-reset-date">○</a>
          <a className="next" href="#" onClick={(e) => { e.preventDefault(); nextMonth(); }} data-testid="button-next-month">⟶</a>
        </span>
      </div>
      
      {/* Days grid */}
      <div className="calendar-weekdays">
        {dayNames.map((name, i) => (
          <div key={i} className="calendar-day">{name}</div>
        ))}
      </div>
      
      <div className="calendar-days">
        {calendar.map((item, i) => {
          if (typeof item === 'number') {
            const selected = isSelected(item);
            const hasEvents = hasDeadlines(item);
            let cls = "calendar-day";
            if (selected) cls += " day-active";
            if (hasEvents) cls += " has-events";
            
            return (
              <div 
                key={i} 
                className={cls} 
                onClick={() => handleDayClick(item)}
                data-testid={`day-${item}`}
              >
                {item}
              </div>
            );
          } else {
            return <div key={i} className="calendar-day day-empty"></div>;
          }
        })}
      </div>
    </div>
  );
}
