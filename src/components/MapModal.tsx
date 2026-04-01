import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Hospital } from '../types'

interface Props {
  hospital: Hospital
  onClose: () => void
}

export function MapModal({ hospital, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_JS_KEY as string
    const securityKey = import.meta.env.VITE_AMAP_JS_SECURITY_KEY as string

    const initMap = () => {
      if (!mapRef.current || !(window as any).AMap) return
      const AMap = (window as any).AMap
      const map = new AMap.Map(mapRef.current, {
        zoom: 15,
        center: [hospital.longitude, hospital.latitude],
        mapStyle: 'amap://styles/light',
      })
      const marker = new AMap.Marker({
        position: [hospital.longitude, hospital.latitude],
        title: hospital.name,
      })
      marker.setMap(map)
    }

    if ((window as any).AMap) {
      initMap()
    } else {
      // 高德 JS API 2.0 需要在加载前设置安全密钥
      ;(window as any)._AMapSecurityConfig = { securityJsCode: securityKey }

      const existing = document.getElementById('amap-script')
      if (existing) {
        existing.addEventListener('load', initMap)
      } else {
        const script = document.createElement('script')
        script.id = 'amap-script'
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
        script.onload = initMap
        document.head.appendChild(script)
      }
    }
  }, [hospital])

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-base">{hospital.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{hospital.type}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={mapRef} style={{ height: '300px', width: '100%' }} />

        <div className="px-5 py-4 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>📍</span>
            <span>{hospital.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📞</span>
            <a
              href={`tel:${hospital.phone}`}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {hospital.phone}
            </a>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-slate-400">距离 {hospital.distance}</span>
            <span className="text-xs text-slate-400">等待约 {hospital.waitTime}</span>
            {hospital.emergency && (
              <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                急诊
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapModal
