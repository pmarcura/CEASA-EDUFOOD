

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Coffee, Sun, Moon } from 'lucide-react';

interface MealCalendarProps {
    onDateSelect: (date: Date) => void;
}

const getMealType = (timestamp: number): 'breakfast' | 'lunch' | 'dinner' => {
    const hour = new Date(timestamp).getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    return 'dinner';
};


const MealCalendar: React.FC<MealCalendarProps> = ({ onDateSelect }) => {
    const context = useContext(AppContext);
    const [currentDate, setCurrentDate] = useState(new Date());

    const { mealLog } = context || { mealLog: [] };

    const healthyDays = useMemo(() => {
        const days = new Set<string>();
        mealLog.forEach(log => {
            const isHealthy = log.novaBreakdown && log.novaBreakdown.in_natura > log.novaBreakdown.ultra_processed;
            if (isHealthy) {
                days.add(new Date(log.timestamp).toDateString());
            }
        });
        return days;
    }, [mealLog]);

    const mealsByDay = useMemo(() => {
        const groups: Record<string, { breakfast?: boolean, lunch?: boolean, dinner?: boolean }> = {};
        mealLog.forEach(log => {
            const dateString = new Date(log.timestamp).toDateString();
            if (!groups[dateString]) {
                groups[dateString] = {};
            }
            const mealType = getMealType(log.timestamp);
            groups[dateString][mealType] = true;
        });
        return groups;
    }, [mealLog]);

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const today = new Date();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div key={i} className="font-bold text-brand-text-secondary text-xs h-8 flex items-center justify-center">{day}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = date.toDateString();
                    const isToday = dateString === today.toDateString();
                    const isHealthy = healthyDays.has(dateString);
                    const mealsOnThisDay = mealsByDay[dateString];

                    return (
                        <div key={day} className="h-12 flex items-center justify-center">
                            <button
                                onClick={() => onDateSelect(date)}
                                className="relative flex flex-col items-center justify-center h-10 w-10 rounded-full hover:bg-brand-primary-light transition-colors group"
                            >
                                <span className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${isToday ? 'bg-brand-primary text-white font-bold' : 'text-brand-text'} ${isHealthy && !isToday ? 'ring-2 ring-green-400' : ''}`}>
                                    {day}
                                </span>
                                {mealsOnThisDay && (
                                    <div className="absolute bottom-0.5 flex items-center justify-center gap-0.5">
                                        {mealsOnThisDay.breakfast && <Coffee size={8} className="text-gray-500 group-hover:text-brand-primary" />}
                                        {mealsOnThisDay.lunch && <Sun size={8} className="text-gray-500 group-hover:text-brand-primary" />}
                                        {mealsOnThisDay.dinner && <Moon size={8} className="text-gray-500 group-hover:text-brand-primary" />}
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-brand-surface p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-text flex items-center gap-2"><CalendarIcon size={20}/> Calendário de Refeições</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronLeft size={20}/></button>
                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronRight size={20}/></button>
                </div>
            </div>
            <p className="text-center font-semibold mb-3 capitalize">{monthName}</p>
            {renderCalendar()}
        </div>
    );
};

export default MealCalendar;
