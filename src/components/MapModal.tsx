import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Hospital } from '../types'

interface Props {
  hospital: Hospital
  allHospitals?: Hospital[]
  onClose: () => void
}

interface AMapInfoWindowInstance {
  setContent: (content: string) => void
  open: (map: AMapMapInstance, position: [number, number]) => void
}

interface AMapMarkerInstance {
  setMap: (map: AMapMapInstance) => void
  on: (event: string, handler: () => void) => void
}

interface AMapMapInstance {
  destroy?: () => void
  setFitView?: (markers?: AMapMarkerInstance[]) => void
}

interface AMapConstructor {
  Map: new (
    container: HTMLDivElement,
    options: {
      zoom: number
      center: [number, number]
      mapStyle: string
    }
  ) => AMapMapInstance
  Marker: new (options: {
    position: [number, number]
    title: string
  }) => AMapMarkerInstance
  InfoWindow: new (options: {
    content?: string
    offset?: unknown
    closeWhenClickMap?: boolean
  }) => AMapInfoWindowInstance
  Pixel: new (x: number, y: number) => unknown
}

interface AMapWindow extends Window {
  AMap?: AMapConstructor
  _AMapSecurityConfig?: {
    securityJsCode: string
  }
}

export function MapModal({ hospital, allHospitals, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapFailed = useRef(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_JS_KEY as string

    if (!key) {
      mapFailed.current = true
      window.setTimeout(() => setShowFallback(true), 0)
      return
    }

    const securityKey = import.meta.env.VITE_AMAP_JS_SECURITY_KEY as string

    // Deduplicate and build the list of hospitals to show on the map
    const hospitalsToShow =
      allHospitals && allHospitals.length > 1
        ? allHospitals
        : [hospital]

    const initMap = () => {
      const amapWindow = window as AMapWindow
      if (!mapRef.current || !amapWindow.AMap) return
      const AMap = amapWindow.AMap

      const hasMultiple = hospitalsToShow.length > 1
      const map = new AMap.Map(mapRef.current, {
        zoom: hasMultiple ? 13 : 15,
        center: [hospital.longitude, hospital.latitude],
        mapStyle: 'amap://styles/light',
      })

      const infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -30),
        closeWhenClickMap: true,
      })

      const markers: AMapMarkerInstance[] = []
      hospitalsToShow.forEach((h) => {
        const marker = new AMap.Marker({
          position: [h.longitude, h.latitude],
          title: h.name,
        })
        marker.on('click', () => {
          infoWindow.setContent(
            `<div style="padding:4px 8px;font-size:13px;white-space:nowrap">${h.name}</div>`
          )
          infoWindow.open(map, [h.longitude, h.latitude])
        })
        marker.setMap(map)
        markers.push(marker)
      })

      if (hasMultiple && map.setFitView) {
        map.setFitView(markers)
      }
    }

    const amapWindow = window as AMapWindow

    if (amapWindow.AMap) {
      initMap()
    } else {
      // 高德 JS API 2.0 需要在加载前设置安全密钥
      amapWindow._AMapSecurityConfig = { securityJsCode: securityKey }

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

    // Fallback: if map doesn't load within 5 seconds, show web link
    const fallbackTimer = window.setTimeout(() => {
      if (!mapFailed.current) {
        const amapCheck = window as AMapWindow
        if (!amapCheck.AMap) {
          mapFailed.current = true
          setShowFallback(true)
        }
      }
    }, 5000)

    return () => window.clearTimeout(fallbackTimer)
  }, [hospital, allHospitals])

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-lg mx-3 md:mx-4 shadow-2xl"
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

        {showFallback ? (
          <div style={{ height: window.innerWidth < 768 ? '250px' : '300px', width: '100%' }} className="flex flex-col items-center justify-center bg-slate-100 gap-3">
            <p className="text-sm text-slate-500">地图加载失败</p>
            <a
              href={`https://www.amap.com/search?query=${encodeURIComponent(hospital.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              在高德地图中搜索
            </a>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: window.innerWidth < 768 ? '250px' : '300px', width: '100%' }} />
        )}

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
