import React from 'react'
import FilterStudio from '../components/FilterStudio'

export default function Filters() {
  return (
    <div className="min-h-[60vh] p-6">
      <h1 className="text-2xl font-bold mb-4">Filters Demo</h1>
      <p className="mb-4 text-gray-600">Free client-side filters: upload images (no camera permission) or use camera (browser permission required).</p>
      <FilterStudio />
    </div>
  )
}
