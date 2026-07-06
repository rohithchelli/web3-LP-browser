import { BrowserProvider } from '@/lib/browser/store'
import { BrowserShell } from '@/components/browser/browser-shell'

export default function Page() {
  return (
    <BrowserProvider>
      <BrowserShell />
    </BrowserProvider>
  )
}
