
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateRange } from "react-day-picker";

interface CalendarFilterProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  entryDates: Date[];
}

export function CalendarFilter({ selectedDate, onDateChange, entryDates }: CalendarFilterProps) {
  const [month, setMonth] = React.useState<Date>(selectedDate || new Date());

  const entryDateSet = new Set(entryDates.map(d => d.toDateString()));

  const modifiers = {
    hasEntries: (date: Date) => entryDateSet.has(date.toDateString()),
  };

  const modifiersClassNames = {
    hasEntries: 'bg-primary/30 text-primary-foreground rounded-full font-semibold',
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      onDateChange(normalizedDate);
    } else {
      onDateChange(undefined);
    }
  };


  return (
    <Card className="shadow-lg rounded-lg"> {/* Removed sticky top */}
      <CardHeader>
        {/* CardTitle can be omitted if DialogTitle is sufficient */}
        {/* <CardTitle className="text-xl">Journal Calendar</CardTitle> */}
      </CardHeader>
      <CardContent className="flex justify-center p-2 sm:p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
          className="rounded-md border shadow-sm"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          footer={
            selectedDate ? (
              <p className="text-sm text-center pt-2 text-muted-foreground">
                Filtering for: {selectedDate.toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm text-center pt-2 text-muted-foreground">
                Select a day to filter entries.
              </p>
            )
          }
        />
      </CardContent>
    </Card>
  );
}
