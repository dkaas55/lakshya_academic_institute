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
    container.style.height = 'auto'
    container.style.overflow = 'hidden'
    document.body.appendChild(container)

    // b) Create a clean inner div for rendering the template.
    const innerDiv = document.createElement('div')
    innerDiv.style.width = '700px'
    innerDiv.style.background = 'white'
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

      // d) Triggers html2pdf().from(innerDiv).save().
      await html2pdf().set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(innerDiv).save()

    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err)
      throw err
    } finally {
      // e) Removes the elements from the DOM and unmounts the root immediately after.
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
