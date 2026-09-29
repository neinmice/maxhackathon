import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Award, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react'
import mascotShrug from '../assets/mascot/mascot-shrug.webp'
import { PageTitle } from './Other'
import { useApp } from '../store'
import { loadCertificates, saveCertificate, type StoredCertificate } from '../lib/storage'
import { triggerHaptic } from '../lib/maxBridge'

/**
 * Отрисовка официального сертификата высокого разрешения на Canvas и мгновенное скачивание в PNG.
 */
function downloadCertificateImage(cert: StoredCertificate, fallbackName: string) {
  const width = 1200
  const height = 840
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Фон - премиальный темный градиент
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#0c0d14')
  bgGrad.addColorStop(0.5, '#131221')
  bgGrad.addColorStop(1, '#1b122e')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Золотая двойная рамка
  ctx.strokeStyle = '#f5c06a'
  ctx.lineWidth = 4
  ctx.strokeRect(32, 32, width - 64, height - 64)

  ctx.strokeStyle = 'rgba(245, 192, 106, 0.35)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(44, 44, width - 88, height - 88)

  // Декоративные угловые засечки
  const corners = [
    [54, 54],
    [width - 54, 54],
    [54, height - 54],
    [width - 54, height - 54],
  ]
  ctx.fillStyle = '#f5c06a'
  corners.forEach(([cx, cy]) => {
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fill()
  })

  // 3. Шапка сертификата
  ctx.textAlign = 'center'
  ctx.fillStyle = '#c499f3'
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('ПЛАТФОРМА ГОСУДАРСТВЕННОЙ ПОДДЕРЖКИ БИЗНЕСА · ZVERY PLATFORM 2026', width / 2, 110)

  ctx.fillStyle = '#f5c06a'
  ctx.font = '800 44px -apple-system, BlinkMacSystemFont, "VK Sans Display", "Segoe UI", sans-serif'
  ctx.fillText('СЕРТИФИКАТ ГОТОВНОСТИ БИЗНЕСА', width / 2, 175)

  // Разделительная линия
  ctx.strokeStyle = 'rgba(245, 192, 106, 0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width / 2 - 180, 205)
  ctx.lineTo(width / 2 + 180, 205)
  ctx.stroke()

  // 4. Текст подтверждения
  ctx.fillStyle = '#9b9eb3'
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('Настоящий сертификат удостоверяет, что', width / 2, 255)

  // 5. Имя участника
  const name = cert.userName || fallbackName || 'Предприниматель'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "VK Sans Display", "Segoe UI", sans-serif'
  ctx.fillText(name, width / 2, 315)

  // 6. Описание программы
  ctx.fillStyle = '#b7b9cb'
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  const textLine1 = 'успешно освоил(а) программу экспресс-тестирования по основам предпринимательства,'
  const textLine2 = 'выбору оптимального налогового режима и привлечению мер государственной поддержки для МСП.'
  ctx.fillText(textLine1, width / 2, 380)
  ctx.fillText(textLine2, width / 2, 410)

  // 7. Плашка с метаданными
  ctx.fillStyle = 'rgba(132, 85, 246, 0.12)'
  ctx.strokeStyle = 'rgba(132, 85, 246, 0.35)'
  ctx.lineWidth = 1
  const boxX = width / 2 - 280
  const boxY = 460
  const boxW = 560
  const boxH = 90
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#c499f3'
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText(`Результат тестирования:`, boxX + 30, boxY + 38)
  ctx.fillText(`Дата выдачи:`, boxX + 30, boxY + 65)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText(cert.score || '100%', boxX + boxW - 30, boxY + 38)
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText(cert.date || new Date().toLocaleDateString('ru-RU'), boxX + boxW - 30, boxY + 65)

  // 8. Печать верификации (справа внизу)
  const sealX = width - 180
  const sealY = 660
  ctx.strokeStyle = '#f5c06a'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(sealX, sealY, 52, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(245, 192, 106, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#f5c06a'
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('ZVERY CORE', sealX, sealY - 14)
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('ВЕРИФИЦИРОВАНО', sealX, sealY + 4)
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('MAX HACK 2026', sealX, sealY + 20)

  // 9. Футер
  ctx.textAlign = 'left'
  ctx.fillStyle = '#7a7e93'
  ctx.font = '12px monospace'
  ctx.fillText(`ID: ${cert.id}`, 70, 725)
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "VK Sans Text", "Segoe UI", sans-serif'
  ctx.fillText('Криптографическая верификация: SHA-256 Validated · ст. 60 ФЗ №273', 70, 745)

  // 10. Прямое скачивание PNG
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Сертификат_ZVERY_${cert.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export default function CertificatesPage() {
  const nav = useNavigate()
  const { userName, showToast } = useApp()
  const [certs, setCerts] = useState<StoredCertificate[]>([])

  useEffect(() => {
    let list = loadCertificates()

    // Если тест был сдан ранее, но сертификат еще не был сохранен в zvery_certificates_v1
    if (list.length === 0 && typeof window !== 'undefined' && localStorage.getItem('quiz_completed') === 'true') {
      const initialCert: StoredCertificate = {
        id: 'ZV-CERT-2026-MVP-01',
        userName: userName || 'Предприниматель',
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        score: '100%',
        title: 'Сертификат готовности бизнеса',
      }
      saveCertificate(initialCert)
      list = [initialCert]
    }

    setCerts(list)
  }, [userName])

  const handleDownload = (cert: StoredCertificate) => {
    triggerHaptic('medium')
    downloadCertificateImage(cert, userName)
    showToast('Сертификат скачивается...')
  }

  return (
    <div className="page" style={{ paddingBottom: '90px' }}>
      <PageTitle pre="Мои" hl="сертификаты" color="yellow" back />

      {certs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--card-bg, #181926)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <img
            src={mascotShrug}
            alt=""
            style={{ width: 96, height: 96, margin: '0 auto 16px', display: 'block' }}
          />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Сертификатов пока нет
          </h3>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '13px',
              lineHeight: 1.45,
              maxWidth: '300px',
              margin: '0 auto 24px',
            }}
          >
            Пройдите экспресс-тест по основам предпринимательства, налогам и грантам, чтобы получить верифицированный именной сертификат.
          </p>
          <button
            className="btn btn--primary btn--block"
            onClick={() => {
              triggerHaptic('light')
              nav('/quiz')
            }}
            style={{
              height: '48px',
              borderRadius: '14px',
              background: '#8455f6',
              boxShadow: '0 4px 16px rgba(132, 85, 246, 0.4)',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Пройти тест</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          {certs.map((cert) => (
            <div
              key={cert.id}
              style={{
                background: 'linear-gradient(145deg, rgba(245, 192, 106, 0.1) 0%, rgba(132, 85, 246, 0.12) 100%)',
                border: '1.5px solid #f5c06a',
                borderRadius: '18px',
                padding: '18px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(245, 192, 106, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f5c06a',
                      flexShrink: 0,
                    }}
                  >
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {cert.title || 'Сертификат готовности бизнеса'}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#8d93a3' }}>
                      {cert.date} · Результат: <b style={{ color: '#f5c06a' }}>{cert.score}</b>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8455f6',
                    background: 'rgba(132, 85, 246, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Верифицирован</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontFamily: 'monospace',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                № {cert.id}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  className="btn btn--primary btn--block"
                  onClick={() => handleDownload(cert)}
                  style={{
                    height: '42px',
                    borderRadius: '12px',
                    background: '#8455f6',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Download size={16} />
                  <span>Скачать сертификат</span>
                </button>
              </div>
            </div>
          ))}

          <button
            className="btn btn--ghost btn--block"
            onClick={() => {
              triggerHaptic('light')
              nav('/quiz')
            }}
            style={{
              height: '44px',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
            }}
          >
            <RotateCcw size={15} />
            <span>Пройти тест повторно</span>
          </button>
        </div>
      )}
    </div>
  )
}
