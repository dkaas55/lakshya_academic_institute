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

    // a) Create a container div positioned offscreen.
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '700px'
    container.style.height = '980px'
    container.style.overflow = 'hidden'
    document.body.appendChild(container)

    // b) Create a clean inner div for rendering the template.
    const innerDiv = document.createElement('div')
    innerDiv.style.width = '700px'
    innerDiv.style.height = '980px'
    innerDiv.style.background = 'white'
    innerDiv.style.overflow = 'hidden'
    container.appendChild(innerDiv)

    let root
    try {
      root = createRoot(innerDiv)
      flushSync(() => {
        root.render(<FeeReceiptTemplate receiptInfo={receiptInfo} student={student} />)
      })

      // c) Wait for 500ms delay to allow CSS/data/images to paint.
      await new Promise(resolve => setTimeout(resolve, 500))

      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      // d) Configure html2pdf worker
      const worker = html2pdf().set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(innerDiv)

      // e) Produce PDF blob and trigger explicit anchor download
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
        }, 1000)
      } else {
        // Fallback to worker.save() if blob generation is not available
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
