"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plane,
  AlertCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string;
}

interface Absent {
  id: string;
  date: string;
  reason: string;
  isExcused: boolean;
}

interface CalendarEvent {
  date: Date;
  type: "leave" | "absent";
  data: Leave | Absent;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [absents, setAbsents] = useState<Absent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leavesRes, absentsRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/absents"),
      ]);

      const leavesData = await leavesRes.json();
      const absentsData = await absentsRes.json();

      setLeaves(leavesData.leaves || []);
      setAbsents(absentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Check leaves
    leaves.forEach((leave) => {
      const startDate = parseISO(leave.startDate);
      const endDate = parseISO(leave.endDate);
      let currentDate = startDate;

      while (currentDate <= endDate) {
        if (isSameDay(currentDate, date)) {
          events.push({ date, type: "leave", data: leave });
          break;
        }
        currentDate = addDays(currentDate, 1);
      }
    });

    // Check absents
    absents.forEach((absent) => {
      const absentDate = parseISO(absent.date);
      if (isSameDay(absentDate, date)) {
        events.push({ date, type: "absent", data: absent });
      }
    });

    return events;
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const events = getEventsForDate(currentDay);
        const isToday = isSameDay(currentDay, new Date());
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);

        days.push(
          <div
            key={currentDay.toString()}
            onClick={() => setSelectedDate(currentDay)}
            className={`min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-colors ${
              !isCurrentMonth ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50"
            } ${isSelected ? "bg-indigo-50 border-indigo-200" : ""}`}
          >
            <div
              className={`text-sm font-medium mb-1 ${
                isToday
                  ? "bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center"
                  : ""
              }`}
            >
              {format(currentDay, "d")}
            </div>
            <div className="space-y-1">
              {events.slice(0, 2).map((event, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-2 py-1 rounded truncate ${
                    event.type === "leave"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {event.type === "leave"
                    ? (event.data as Leave).type
                    : "Absent"}
                </div>
              ))}
              {events.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{events.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const events = getEventsForDate(selectedDate);

    return (
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Events on {format(selectedDate, "MMMM d, yyyy")}
        </h3>
        {events.length === 0 ? (
          <p className="text-gray-500">No events on this date</p>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  event.type === "leave"
                    ? "bg-blue-50 border border-blue-100"
                    : "bg-red-50 border border-red-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {event.type === "leave" ? (
                    <Plane className="w-4 h-4 text-blue-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      event.type === "leave" ? "text-blue-700" : "text-red-700"
                    }`}
                  >
                    {event.type === "leave"
                      ? `${(event.data as Leave).type} Leave`
                      : "Absent"}
                  </span>
                  {event.type === "leave" && (
                    <span
                      className={`ml-auto text-xs px-2 py-1 rounded ${
                        (event.data as Leave).status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : (event.data as Leave).status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {(event.data as Leave).status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {event.type === "leave"
                    ? (event.data as Leave).reason
                    : (event.data as Absent).reason}
                </p>
                {event.type === "leave" && (
                  <p className="text-xs text-gray-500 mt-2">
                    {format(parseISO((event.data as Leave).startDate), "MMM d")} -{" "}
                    {format(parseISO((event.data as Leave).endDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        {renderSelectedDateEvents()}
      </div>
    </ProtectedLayout>
  );
}
