import { Button } from '@/components/ui/button'
import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Not Found</h2>
      <p className="mb-4">Could not find requested resource</p>
      <Button>
      <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}