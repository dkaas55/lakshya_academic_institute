import { useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import FeeReceiptTemplate from '../components/FeeReceiptTemplate'

export function usePdfGenerator() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const generatePdf = useCallback(async (receiptInfo, student, fileName) => {
    setGenerating(true)
    setError(null)

    // a) Create an offscreen container isolated from mobile viewport scaling
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '794px'
    container.style.minWidth = '794px'
    container.style.height = '1123px'
    container.style.overflow = 'hidden'
    container.style.zIndex = '-9999'
    document.body.appendChild(container)

    // b) Create a clean inner div matching A4 proportions at 96 DPI (794px x 1123px)
    const innerDiv = document.createElement('div')
    innerDiv.style.width = '794px'
    innerDiv.style.minWidth = '794px'
    innerDiv.style.height = '1123px'
    innerDiv.style.background = '#ffffff'
    innerDiv.style.color = '#0f172a'
    innerDiv.style.overflow = 'hidden'
    innerDiv.style.boxSizing = 'border-box'
    container.appendChild(innerDiv)

    let root
    try {
      root = createRoot(innerDiv)
      flushSync(() => {
        root.render(<FeeReceiptTemplate receiptInfo={receiptInfo} student={student} />)
      })

      // c) Ensure fonts and images are loaded across mobile browsers
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready
        } catch {
          // ignore font loading fallback
        }
      }

      // Wait 300ms for images and layout paint
      await new Promise(resolve => setTimeout(resolve, 300))

      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      // d) Configure html2pdf worker with fixed windowWidth and scroll offsets
      // This prevents mobile browsers from squashing or wrapping the layout
      const worker = html2pdf().set({
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 1200,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(innerDiv)

      // e) Produce PDF blob and trigger download
      const pdfBlob = await worker.output('blob')
      if (pdfBlob && typeof window !== 'undefined') {
        const blobUrl = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(blobUrl)
        }, 1500)
      } else {
        await worker.save()
      }

    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err)
      throw err
    } finally {
      // f) Removes the elements from the DOM and unmounts the root immediately after.
      if (root) {
        try {
          root.unmount()
        } catch (unmountError) {
          console.error('Failed to unmount root:', unmountError)
        }
      }
      container.remove()
      setGenerating(false)
    }
  }, [])

  return { generatePdf, generating, error }
}
