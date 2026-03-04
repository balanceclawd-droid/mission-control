"use client";

import { useState } from "react";

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0b0f19]/95 backdrop-blur border-b border-slate-800">
      {/* Search bar */}
      <div
        className={`flex items-center gap-2 w-full max-w-md px-3 py-1.5 rounded-md border transition-colors ${
          searchFocused
            ? "border-slate-600 bg-slate-800/60"
            : "border-slate-800 bg-slate-900/40"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 text-slate-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search or jump to..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none min-w-0"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 text-xs text-slate-600 border border-slate-700 rounded px-1 py-0.5 font-mono shrink-0">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* notification dot */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-medium text-slate-200">
          R
        </div>
      </div>
    </header>
  );
}
