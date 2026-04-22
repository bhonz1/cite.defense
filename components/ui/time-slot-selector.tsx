"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimeSlot {
  hour: number;
  time: string;
  endTime?: string;
  code?: string;
  display?: string;
}

interface TimeSlotSelectorProps {
  availableSlots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  className?: string;
}

export function TimeSlotSelector({ 
  availableSlots, 
  selectedTime, 
  onTimeSelect, 
  className 
}: TimeSlotSelectorProps) {
  if (availableSlots.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No available slots for this date and room.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {availableSlots.map((slot) => (
        <motion.button
          key={slot.hour}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTimeSelect(slot.time)}
          className={cn(
            "p-4 rounded-xl text-left transition-all duration-200 border-2",
            selectedTime === slot.time
              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 border-orange-500"
              : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className={cn(
                "h-5 w-5",
                selectedTime === slot.time ? "text-white" : "text-gray-400"
              )} />
              <div>
                <div className={cn(
                  "font-semibold text-sm",
                  selectedTime === slot.time ? "text-white" : "text-gray-900"
                )}>
                  {slot.display || `${slot.time} - ${slot.endTime || 'N/A'}`
                }
                </div>
                {slot.code && (
                  <div className={cn(
                    "text-xs mt-1",
                    selectedTime === slot.time ? "text-orange-100" : "text-gray-500"
                  )}>
                    Code: {slot.code}
                  </div>
                )}
              </div>
            </div>
            {selectedTime === slot.time && (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

export default TimeSlotSelector;
