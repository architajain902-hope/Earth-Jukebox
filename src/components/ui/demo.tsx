"use client"

import { PeakChart } from "@/components/ui/peak-chart"

export function PeakChartDemo() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[540px] overflow-hidden rounded-3xl border border-white/10 bg-card shadow-xl backdrop-blur-xl">
          <PeakChart />
        </div>
      </div>
    </div>
  )
}

export default PeakChartDemo
